package com.linx.dashboard;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.Promise;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.jdbc.JDBCClient;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.RoutingContext;
import io.vertx.ext.web.handler.BodyHandler;
import io.vertx.ext.web.handler.StaticHandler;
import io.vertx.ext.web.templ.handlebars.HandlebarsTemplateEngine;
import io.vertx.ext.web.FileUpload;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.Set;
import java.util.List;

import com.github.jknack.handlebars.Handlebars;
import com.github.jknack.handlebars.Helper;
import com.github.jknack.handlebars.Options;
import java.io.IOException;

public class MainVerticle extends AbstractVerticle {

  private HandlebarsTemplateEngine engine;
  private JDBCClient jdbcClient;
  private static final String UPLOAD_DIR = "uploads";
  private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp");
  private static final Set<String> ALLOWED_VIDEO_TYPES = Set.of("video/mp4", "video/avi", "video/mov", "video/wmv");
  private static final Set<String> ALLOWED_AUDIO_TYPES = Set.of("audio/mp3", "audio/wav", "audio/ogg");
  private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  @Override
  public void start(Promise<Void> startPromise) throws Exception {
    // Configure database with connection pooling and environment variables
    String dbHost = System.getenv().getOrDefault("DB_HOST", "localhost");
    String dbPort = System.getenv().getOrDefault("DB_PORT", "3306");  // PostgreSQL utilise 5432
    String dbName = System.getenv().getOrDefault("DB_NAME", "linx");
    String dbUser = System.getenv().getOrDefault("DB_USER", "root");
    String dbPassword = System.getenv().getOrDefault("DB_PASSWORD", "Clint.mariadb");

    JsonObject config = new JsonObject()
      .put("url", String.format("jdbc:mariadb://%s:%s/%s?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true",
        dbHost, dbPort, dbName))
      .put("driver_class", "org.mariadb.jdbc.Driver")
      .put("user", dbUser)
      .put("password", dbPassword)
      .put("max_pool_size", 20)
      .put("initial_pool_size", 5)
      .put("min_pool_size", 5)
      .put("max_idle_time", 300)
      .put("acquire_retry_attempts", 4)
      .put("preferredTestQuery", "SELECT 1")
      .put("testConnectionOnCheckin", true)
      .put("idleConnectionTestPeriod", 60);

    jdbcClient = JDBCClient.createShared(vertx, config);
    engine = HandlebarsTemplateEngine.create(vertx);
    // Ajoutez cette ligne pour spécifier le répertoire des templates
    //engine.setExtension("hbs");
    //engine.setMaxCacheSize(0);
    // Register custom Handlebars helpers
    Handlebars handlebars = engine.getHandlebars();

    handlebars.registerHelper("eq", new Helper<Object>() {
      @Override
      public Object apply(Object context, Options options) throws IOException {
          Object param = options.param(0);
          return context != null && context.equals(param);
      }
    });

    handlebars.registerHelper("isTexteType", new Helper<Object>() {
      @Override
      public Object apply(Object context, Options options) throws IOException {
          if (context == null) return false;
          return "texte".equals(context.toString());
      }
    });

    handlebars.registerHelper("isAudioType", new Helper<Object>() {
      @Override
      public Object apply(Object context, Options options) throws IOException {
          if (context == null) return false;
          return "audio".equals(context.toString());
      }
    });

    handlebars.registerHelper("isVideoType", new Helper<Object>() {
      @Override
      public Object apply(Object context, Options options) throws IOException {
          if (context == null) return false;
          return "video".equals(context.toString());
      }
    });

    handlebars.registerHelper("excerptContenu", new Helper<String>() {
      @Override
      public Object apply(String context, Options options) throws IOException {
          if (context == null || context.toString().isEmpty()) return "";
          String content = context.toString();
          return content.length() > 100 ? content.substring(0, 100) : content;
      }
    });

    handlebars.registerHelper("formattedDate", new Helper<String>() {
      @Override
      public Object apply(String context, Options options) throws IOException {
          if (context == null || context.toString().isEmpty()) return "-";
          String dateStr = context.toString();
          // Handle different date formats
          if (dateStr.length() >= 10) {
            return dateStr.substring(0, 10);
          }
          return dateStr;
      }
    });

    // Create upload directory if it doesn't exist
    createUploadDirectory();

    Router router = Router.router(vertx);

    // Configure body handler with file upload support
    BodyHandler bodyHandler = BodyHandler.create()
      .setUploadsDirectory(UPLOAD_DIR)
      .setDeleteUploadedFilesOnEnd(false)
      .setHandleFileUploads(true)
      .setBodyLimit(MAX_FILE_SIZE);

    router.route().handler(bodyHandler);

    // Static files handler
    router.route("/static/*").handler(StaticHandler.create("webroot/static"));
    router.route("/uploads/*").handler(StaticHandler.create(UPLOAD_DIR));

    //website
    router.get("/linx").handler(this::renderHome);
    // Authentication
    router.get("/").handler(this::handlestartLogin);
    router.post("/api/login").handler(this::handleLogin);
    router.get("/redirect").handler(this::handleredirect);


    // Main dashboard route
    router.get("/dashboard").handler(this::handleDashboard);
    router.get("/db-test").handler(this::handleDbTest);

    // API Routes
    router.get("/api/creators").handler(this::handleGetCreators);
    router.get("/api/creator/:id").handler(this::handleGetCreator);
    router.get("/api/templates/:creatorId").handler(this::handleGetTemplatesByCreator);

    // Template management
    router.post("/api/template").handler(this::handleAddTemplate);
    router.put("/api/template/:id").handler(this::handleUpdateTemplate);
    router.delete("/api/template/:id").handler(this::handleDeleteTemplate);

    // Testimonial management
    router.get("/api/testimonials").handler(this::handleGetTestimonials);
    router.post("/api/testimonial").handler(this::handleAddTestimonial);
    router.put("/api/testimonial/:id").handler(this::handleUpdateTestimonial);
    router.delete("/api/testimonial/:id").handler(this::handleDeleteTestimonial);

    // Partner management
    router.get("/api/partners").handler(this::handleGetPartners);
    router.post("/api/partner").handler(this::handleAddPartner);
    router.put("/api/partner/:id").handler(this::handleUpdatePartner);
    router.delete("/api/partner/:id").handler(this::handleDeletePartner);

    int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8888"));

    vertx.createHttpServer()
      .requestHandler(router)
      .listen(port)
      .onSuccess(server -> {
        System.out.println("HTTP server started on port " + port);
        startPromise.complete();
      })
      .onFailure(startPromise::fail);
  }

  private void createUploadDirectory() {
    try {
      Path uploadPath = Paths.get(UPLOAD_DIR);
      if (!Files.exists(uploadPath)) {
        Files.createDirectories(uploadPath);
        System.out.println("Created upload directory: " + UPLOAD_DIR);
      }
    } catch (Exception e) {
      System.err.println("Failed to create upload directory: " + e.getMessage());
    }
  }

  private void renderHome(RoutingContext ctx) {
    ctx.reroute("/static/linx/hello.html");
  }

  private void handlestartLogin(RoutingContext ctx) {
    JsonObject data = new JsonObject()
      .put("title", "Admin-login Dashboard - Linx Concept");
    renderTemplate(ctx, data, "src/main/resources/templates/login.hbs");

  }

  private void handleLogin(RoutingContext ctx) {
    try {
      io.vertx.core.buffer.Buffer buffer = ctx.getBody();
      if (buffer == null || buffer.length() == 0) {
        ctx.response().setStatusCode(400)
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("error", "Empty request body").encode());
        return;
      }

      JsonObject body = buffer.toJsonObject();

      String username = body.getString("username");
      String password = body.getString("password");

      if (username == null || password == null) {
        ctx.response().setStatusCode(400)
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("error", "Missing username or password").encode());
        return;
      }

      jdbcClient.queryWithParams(
        "SELECT id, nom, role, niveau_acces FROM users WHERE email = ? AND mot_de_passe = ?",
        new JsonArray().add(username).add(password),
        res -> {
          if (res.succeeded() && res.result().getNumRows() > 0) {
            JsonObject user = res.result().getRows().get(0);
            if(user.getInteger("niveau_acces") < 5){
              ctx.response().setStatusCode(401)
                .putHeader("Content-Type", "application/json")
                .end(new JsonObject().put("error", "low access level. Need atleast 5").encode());
            } else {
              ctx.response()
                .putHeader("Content-Type", "application/json")
                .end(new JsonObject()
                  .put("success", true)
                  .put("user", user)
                  .encode());
            }

          } else {
            ctx.response().setStatusCode(401)
              .putHeader("Content-Type", "application/json")
              .end(new JsonObject().put("error", "Invalid credentials").encode());
          }
        });
    } catch (Exception e) {
      System.err.println("Login error: " + e.getMessage());
      ctx.response().setStatusCode(400)
        .putHeader("Content-Type", "application/json")
        .end(new JsonObject().put("error", "Invalid JSON format").encode());
    }
  }

  private void handleredirect(RoutingContext ctx) {
    ctx.redirect("/dashboard");
  }

  private void handleDashboard(RoutingContext ctx) {
    JsonObject data = new JsonObject()
      .put("title", "Admin Dashboard - Linx Concept");

    jdbcClient.query("SELECT id, nom, role, avatar_url, date_inscription FROM users WHERE role='ingenieur'", res -> {
      if (res.succeeded()) {
        data.put("creators", res.result().getRows());

        // Get testimonials
        jdbcClient.query("SELECT id, titre, type, contenu, fichier_url, TO_CHAR(date_creation, 'YYYY-MM-DD') as date_creation FROM temoignages ORDER BY date_creation DESC LIMIT 10", testimonialsRes -> {
          if (testimonialsRes.succeeded()) {
            data.put("testimonials", testimonialsRes.result().getRows());
          }

          // Get partners
          jdbcClient.query("SELECT id, nom, logo_url, TO_CHAR(date_ajout, 'YYYY-MM-DD') as date_ajout FROM partenaires ORDER BY date_ajout DESC", partnersRes -> {
            if (partnersRes.succeeded()) {
              data.put("partners", partnersRes.result().getRows());
            }

            renderTemplate(ctx, data, "src/main/resources/templates/index.hbs");
          });
        });
      } else {
        ctx.fail(res.cause());
      }
    });
  }

  private void handleDbTest(RoutingContext ctx) {
    jdbcClient.query("SELECT 1", res -> {
      if (res.succeeded()) {
        ctx.response()
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("status", "OK").put("message", "Database connection successful").encode());
      } else {
        ctx.response()
          .setStatusCode(500)
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("status", "ERROR").put("message", res.cause().getMessage()).encode());
      }
    });
  }

  private void handleGetCreators(RoutingContext ctx) {
    jdbcClient.query("SELECT id, nom, role, avatar_url FROM users WHERE role='ingenieur'", res -> {
      if (res.succeeded()) {
        ctx.response()
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("creators", res.result().getRows()).encode());
      } else {
        ctx.fail(res.cause());
      }
    });
  }

  private void handleGetCreator(RoutingContext ctx) {
    String id = ctx.pathParam("id");
    jdbcClient.queryWithParams(
      "SELECT id, nom, role, avatar_url, TO_CHAR(date_inscription, 'YYYY-MM-DD') as date_creation FROM users WHERE id = ? AND role='ingenieur'",
      new JsonArray().add(Integer.parseInt(id)),
      res -> {
        if (res.succeeded() && res.result().getNumRows() > 0) {
          ctx.response()
            .putHeader("Content-Type", "application/json")
            .end(res.result().getRows().get(0).encode());
        } else {
          ctx.response().setStatusCode(404).end();
        }
      });
  }

  private void handleGetTemplatesByCreator(RoutingContext ctx) {
    String creatorId = ctx.pathParam("creatorId");
    jdbcClient.queryWithParams(
      "SELECT id, nom, description, fichier_url, type, visible_clients, cree_par FROM templates WHERE cree_par = ? ORDER BY date_creation DESC",
      new JsonArray().add(Integer.parseInt(creatorId)),
      res -> {
        if (res.succeeded()) {
          ctx.response()
            .putHeader("Content-Type", "application/json")
            .end(new JsonObject().put("templates", res.result().getRows()).encode());
        } else {
          ctx.fail(res.cause());
        }
      });
  }

  private void handleAddTemplate(RoutingContext ctx) {
    try {
      String name = ctx.request().getFormAttribute("name");
      String description = ctx.request().getFormAttribute("description");
      String type = ctx.request().getFormAttribute("type");
      String creatorId = ctx.request().getFormAttribute("creatorId");
      String visibleClients = ctx.request().getFormAttribute("visibleClients");

      if (name == null || description == null || type == null || creatorId == null) {
        ctx.response().setStatusCode(400)
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("error", "Missing required fields").encode());
        return;
      }

      List<FileUpload> uploads = ctx.fileUploads();
      if (uploads.isEmpty()) {
        ctx.response().setStatusCode(400)
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("error", "No file uploaded").encode());
        return;
      }

      FileUpload upload = uploads.get(0);

      // Validate file type and size
      if (!isValidFileType(upload.contentType(), type)) {
        ctx.response().setStatusCode(400)
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("error", "Invalid file type for " + type).encode());
        return;
      }

      if (upload.size() > MAX_FILE_SIZE) {
        ctx.response().setStatusCode(400)
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("error", "File size exceeds limit").encode());
        return;
      }

      // Generate unique filename
      String originalFilename = upload.fileName();
      String extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
      String uniqueFilename = UUID.randomUUID().toString() + extension;
      final String finalPath = UPLOAD_DIR + "/" + uniqueFilename;

      // Move uploaded file
      vertx.fileSystem().move(upload.uploadedFileName(), finalPath, moveRes -> {
        if (moveRes.succeeded()) {
          // Save to database
          jdbcClient.updateWithParams(
            "INSERT INTO templates (nom, description, fichier_url, type, visible_clients, cree_par) VALUES (?, ?, ?, ?, ?, ?)",
            new JsonArray()
              .add(name)
              .add(description)
              .add(uniqueFilename)
              .add(type)
              .add(Boolean.parseBoolean(visibleClients != null ? visibleClients : "true"))
              .add(Integer.parseInt(creatorId)),
            dbRes -> {
              if (dbRes.succeeded()) {
                ctx.response()
                  .putHeader("Content-Type", "application/json")
                  .end(new JsonObject()
                    .put("success", true)
                    .put("id", dbRes.result().getKeys().getInteger(0))
                    .put("filename", uniqueFilename)
                    .encode());
              } else {
                // Delete uploaded file if database insert fails
                vertx.fileSystem().delete(finalPath, deleteRes -> {});
                ctx.fail(dbRes.cause());
              }
            });
        } else {
          ctx.fail(moveRes.cause());
        }
      });
    } catch (Exception e) {
      ctx.fail(e);
    }
  }

  private void handleUpdateTemplate(RoutingContext ctx) {
    String id = ctx.pathParam("id");
    String name = ctx.request().getFormAttribute("name");
    String description = ctx.request().getFormAttribute("description");
    String visibleClients = ctx.request().getFormAttribute("visibleClients");

    if (name == null || description == null) {
      ctx.response().setStatusCode(400)
        .putHeader("Content-Type", "application/json")
        .end(new JsonObject().put("error", "Missing required fields").encode());
      return;
    }

    jdbcClient.updateWithParams(
      "UPDATE templates SET nom = ?, description = ?, visible_clients = ? WHERE id = ?",
      new JsonArray()
        .add(name)
        .add(description)
        .add(Boolean.parseBoolean(visibleClients != null ? visibleClients : "true"))
        .add(Integer.parseInt(id)),
      res -> {
        if (res.succeeded()) {
          ctx.response()
            .putHeader("Content-Type", "application/json")
            .end(new JsonObject().put("success", true).encode());
        } else {
          ctx.fail(res.cause());
        }
      });
  }

  private void handleDeleteTemplate(RoutingContext ctx) {
    String id = ctx.pathParam("id");

    // First get the file URL to delete the file
    jdbcClient.queryWithParams(
      "SELECT fichier_url FROM templates WHERE id = ?",
      new JsonArray().add(Integer.parseInt(id)),
      selectRes -> {
        if (selectRes.succeeded() && selectRes.result().getNumRows() > 0) {
          final String filename = selectRes.result().getRows().get(0).getString("fichier_url");

          // Delete from database
          jdbcClient.updateWithParams(
            "DELETE FROM templates WHERE id = ?",
            new JsonArray().add(Integer.parseInt(id)),
            deleteRes -> {
              if (deleteRes.succeeded()) {
                // Delete file from filesystem
                vertx.fileSystem().delete(UPLOAD_DIR + "/" + filename, fileDeleteRes -> {
                  // Don't fail if file deletion fails, just log it
                  if (fileDeleteRes.failed()) {
                    System.err.println("Failed to delete file: " + filename);
                  }
                });

                ctx.response()
                  .putHeader("Content-Type", "application/json")
                  .end(new JsonObject().put("success", true).encode());
              } else {
                ctx.fail(deleteRes.cause());
              }
            });
        } else {
          ctx.response().setStatusCode(404).end();
        }
      });
  }

  private void handleGetTestimonials(RoutingContext ctx) {
    jdbcClient.query("SELECT id, titre, type, contenu, auteur_id FROM temoignages ORDER BY date_creation DESC", res -> {
      if (res.succeeded()) {
        ctx.response()
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("testimonials", res.result().getRows()).encode());
      } else {
        ctx.fail(res.cause());
      }
    });
  }

  private void handleAddTestimonial(RoutingContext ctx) {
    try {
      String title = ctx.request().getFormAttribute("titre");
      String type = ctx.request().getFormAttribute("type");
      String authorIdStr = ctx.request().getFormAttribute("authorId");
      String content = ctx.request().getFormAttribute("contenu");

      if (title == null || type == null) {
        ctx.response().setStatusCode(400)
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("error", "Missing required fields").encode());
        return;
      }

      String fileUrl = null;
      List<FileUpload> uploads = ctx.fileUploads();

      if (!uploads.isEmpty() && !type.equals("texte")) {
        FileUpload upload = uploads.get(0);

        // Validate file type
        if ((type.equals("audio") && !ALLOWED_AUDIO_TYPES.contains(upload.contentType())) ||
            (type.equals("video") && !ALLOWED_VIDEO_TYPES.contains(upload.contentType()))) {
          ctx.response().setStatusCode(400)
            .putHeader("Content-Type", "application/json")
            .end(new JsonObject().put("error", "Invalid file type for " + type).encode());
          return;
        }

        if (upload.size() > MAX_FILE_SIZE) {
          ctx.response().setStatusCode(400)
            .putHeader("Content-Type", "application/json")
            .end(new JsonObject().put("error", "File size exceeds limit").encode());
          return;
        }

        // Generate unique filename
        String originalFilename = upload.fileName();
        String extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
        String uniqueFilename = UUID.randomUUID().toString() + extension;
        String finalPath = UPLOAD_DIR + "/" + uniqueFilename;

        // Move uploaded file synchronously for simplicity
        vertx.fileSystem().moveBlocking(upload.uploadedFileName(), finalPath);
        fileUrl = uniqueFilename;
      }

      // Save to database
      String sql = type.equals("texte")
        ? "INSERT INTO temoignages (titre, type, contenu, auteur_id) VALUES (?, ?, ?, ?)"
        : "INSERT INTO temoignages (titre, type, fichier_url, auteur_id) VALUES (?, ?, ?, ?)";

      JsonArray params = new JsonArray()
        .add(title)
        .add(type);

      // Handle authorId - null wenn leer oder nicht numerisch
      Integer authorId = null;
      if (authorIdStr != null && !authorIdStr.trim().isEmpty()) {
        try {
          authorId = Integer.parseInt(authorIdStr);
        } catch (NumberFormatException e) {
          // Behandle ungültige authorId als null
          System.err.println("Invalid authorId format: " + authorIdStr);
        }
      }

      if (type.equals("texte")) {
        params.add(content);
      } else {
        params.add(fileUrl);
      }

      params.add(authorId);

      final String finalFileUrl = fileUrl;
      jdbcClient.updateWithParams(sql, params, dbRes -> {
        if (dbRes.succeeded()) {
          System.out.println("\n updatetd \n");
          ctx.response()
            .putHeader("Content-Type", "application/json")
            .setStatusCode(200)
            .end(new JsonObject()
              .put("success", true)
              .put("id", dbRes.result().getKeys().getInteger(0))
              .encode());
        } else {
          // Delete uploaded file if database insert fails
          deleteFileIfExists(finalFileUrl);
          ctx.fail(dbRes.cause());
        }
      });
    } catch (Exception e) {
      ctx.fail(e);
    }
  }

  private void handleUpdateTestimonial(RoutingContext ctx) {
    try {
      String id = ctx.pathParam("id");
      String title = ctx.request().getFormAttribute("title");
      String type = ctx.request().getFormAttribute("type");
      String content = ctx.request().getFormAttribute("content");
      String authorId = ctx.request().getFormAttribute("authorId");

      if (title == null || type == null) {
        ctx.response().setStatusCode(400)
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("error", "Missing required fields").encode());
        return;
      }

      String fileUrl = null;
      List<FileUpload> uploads = ctx.fileUploads();

      if (!uploads.isEmpty() && !type.equals("texte")) {
        FileUpload upload = uploads.get(0);

        // Validate file type
        if ((type.equals("audio") && !ALLOWED_AUDIO_TYPES.contains(upload.contentType())) ||
            (type.equals("video") && !ALLOWED_VIDEO_TYPES.contains(upload.contentType()))) {
          ctx.response().setStatusCode(400)
            .putHeader("Content-Type", "application/json")
            .end(new JsonObject().put("error", "Invalid file type for " + type).encode());
          return;
        }

        if (upload.size() > MAX_FILE_SIZE) {
          ctx.response().setStatusCode(400)
            .putHeader("Content-Type", "application/json")
            .end(new JsonObject().put("error", "File size exceeds limit").encode());
          return;
        }

        // Generate unique filename
        String originalFilename = upload.fileName();
        String extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
        String uniqueFilename = UUID.randomUUID().toString() + extension;
        String finalPath = UPLOAD_DIR + "/" + uniqueFilename;

        // Move uploaded file
        vertx.fileSystem().moveBlocking(upload.uploadedFileName(), finalPath);
        fileUrl = uniqueFilename;
      }

      // Update database
      String sql;
      JsonArray params = new JsonArray();

      if (type.equals("texte")) {
        sql = "UPDATE temoignages SET titre = ?, type = ?, contenu = ?, auteur_id = ? WHERE id = ?";
        params.add(title).add(type).add(content).add(authorId != null ? Integer.parseInt(authorId) : null).add(Integer.parseInt(id));
      } else {
        if (fileUrl != null) {
          sql = "UPDATE temoignages SET titre = ?, type = ?, contenu = NULL, fichier_url = ?, auteur_id = ? WHERE id = ?";
          params.add(title).add(type).add(fileUrl).add(authorId != null ? Integer.parseInt(authorId) : null).add(Integer.parseInt(id));
        } else {
          sql = "UPDATE temoignages SET titre = ?, type = ?, contenu = NULL, auteur_id = ? WHERE id = ?";
          params.add(title).add(type).add(authorId != null ? Integer.parseInt(authorId) : null).add(Integer.parseInt(id));
        }
      }

      final String finalFileUrl = fileUrl;
      jdbcClient.updateWithParams(sql, params, dbRes -> {
        if (dbRes.succeeded()) {
          ctx.response()
            .putHeader("Content-Type", "application/json")
            .end(new JsonObject().put("success", true).encode());
        } else {
          // Delete uploaded file if database update fails
          deleteFileIfExists(finalFileUrl);
          ctx.fail(dbRes.cause());
        }
      });
    } catch (Exception e) {
      ctx.fail(e);
    }
  }

  private void handleUpdatePartner(RoutingContext ctx) {
    try {
      String id = ctx.pathParam("id");
      String name = ctx.request().getFormAttribute("name");
      String website = ctx.request().getFormAttribute("website");
      String description = ctx.request().getFormAttribute("description");

      if (name == null) {
        ctx.response().setStatusCode(400)
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("error", "Missing partner name").encode());
        return;
      }

      String fileUrl = null;
      List<FileUpload> uploads = ctx.fileUploads();

      if (!uploads.isEmpty()) {
        FileUpload upload = uploads.get(0);

        // Validate file type
        if (!ALLOWED_IMAGE_TYPES.contains(upload.contentType())) {
          ctx.response().setStatusCode(400)
            .putHeader("Content-Type", "application/json")
            .end(new JsonObject().put("error", "Invalid image file type").encode());
          return;
        }

        if (upload.size() > MAX_FILE_SIZE) {
          ctx.response().setStatusCode(400)
            .putHeader("Content-Type", "application/json")
            .end(new JsonObject().put("error", "File size exceeds limit").encode());
          return;
        }

        // Generate unique filename
        String originalFilename = upload.fileName();
        String extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
        String uniqueFilename = UUID.randomUUID().toString() + extension;
        String finalPath = UPLOAD_DIR + "/" + uniqueFilename;

        // Move uploaded file
        vertx.fileSystem().moveBlocking(upload.uploadedFileName(), finalPath);
        fileUrl = uniqueFilename;
      }

      // Update database
      String sql;
      JsonArray params = new JsonArray();

      if (fileUrl != null) {
        sql = "UPDATE partenaires SET nom = ?, logo_url = ?, site_web = ?, description = ? WHERE id = ?";
        params.add(name).add(fileUrl).add(website).add(description).add(Integer.parseInt(id));
      } else {
        sql = "UPDATE partenaires SET nom = ?, site_web = ?, description = ? WHERE id = ?";
        params.add(name).add(website).add(description).add(Integer.parseInt(id));
      }

      final String finalFileUrl = fileUrl;
      jdbcClient.updateWithParams(sql, params, dbRes -> {
        if (dbRes.succeeded()) {
          ctx.response()
            .putHeader("Content-Type", "application/json")
            .end(new JsonObject().put("success", true).encode());
        } else {
          // Delete uploaded file if database update fails
          deleteFileIfExists(finalFileUrl);
          ctx.fail(dbRes.cause());
        }
      });
    } catch (Exception e) {
      ctx.fail(e);
    }
  }

  private void handleDeleteTestimonial(RoutingContext ctx) {
    String id = ctx.pathParam("id");

    // First get the file URL to delete the file
    jdbcClient.queryWithParams(
      "SELECT fichier_url FROM temoignages WHERE id = ?",
      new JsonArray().add(Integer.parseInt(id)),
      selectRes -> {
        if (selectRes.succeeded() && selectRes.result().getNumRows() > 0) {
          final String filename = selectRes.result().getRows().get(0).getString("fichier_url");

          // Delete from database
          jdbcClient.updateWithParams(
            "DELETE FROM temoignages WHERE id = ?",
            new JsonArray().add(Integer.parseInt(id)),
            deleteRes -> {
              if (deleteRes.succeeded()) {
                // Delete file from filesystem if exists
                if (filename != null) {
                  vertx.fileSystem().delete(UPLOAD_DIR + "/" + filename, fileDeleteRes -> {
                    if (fileDeleteRes.failed()) {
                      System.err.println("Failed to delete file: " + filename);
                    }
                  });
                }

                ctx.response()
                  .putHeader("Content-Type", "application/json")
                  .end(new JsonObject().put("success", true).encode());
              } else {
                ctx.fail(deleteRes.cause());
              }
            });
        } else {
          ctx.response().setStatusCode(404).end();
        }
      });
  }

  private void handleGetPartners(RoutingContext ctx) {
    jdbcClient.query("SELECT id, nom, logo_url, site_web, description, TO_CHAR(date_ajout, 'YYYY-MM-DD') as date_ajout FROM partenaires ORDER BY date_ajout DESC", res -> {
      if (res.succeeded()) {
        ctx.response()
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("partners", res.result().getRows()).encode());
      } else {
        ctx.fail(res.cause());
      }
    });
  }

  private void handleAddPartner(RoutingContext ctx) {
    try {
      String name = ctx.request().getFormAttribute("name");
      String website = ctx.request().getFormAttribute("website");
      String description = ctx.request().getFormAttribute("description");

      if (name == null) {
        ctx.response().setStatusCode(400)
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("error", "Missing partner name").encode());
        return;
      }

      List<FileUpload> uploads = ctx.fileUploads();
      if (uploads.isEmpty()) {
        ctx.response().setStatusCode(400)
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("error", "No logo uploaded").encode());
        return;
      }

      FileUpload upload = uploads.get(0);

      // Validate file type
      if (!ALLOWED_IMAGE_TYPES.contains(upload.contentType())) {
        ctx.response().setStatusCode(400)
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("error", "Invalid image file type").encode());
        return;
      }

      if (upload.size() > MAX_FILE_SIZE) {
        ctx.response().setStatusCode(400)
          .putHeader("Content-Type", "application/json")
          .end(new JsonObject().put("error", "File size exceeds limit").encode());
        return;
      }

      // Generate unique filename
      String originalFilename = upload.fileName();
      String extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
      String uniqueFilename = UUID.randomUUID().toString() + extension;
      final String finalPath = UPLOAD_DIR + "/" + uniqueFilename;

      // Move uploaded file
      vertx.fileSystem().move(upload.uploadedFileName(), finalPath, moveRes -> {
        if (moveRes.succeeded()) {
          // Save to database
          jdbcClient.updateWithParams(
            "INSERT INTO partenaires (nom, logo_url, site_web, description) VALUES (?, ?, ?, ?)",
            new JsonArray().add(name).add(uniqueFilename).add(website).add(description),
            dbRes -> {
              if (dbRes.succeeded()) {
                ctx.response()
                  .putHeader("Content-Type", "application/json")
                  .end(new JsonObject()
                    .put("success", true)
                    .put("id", dbRes.result().getKeys().getInteger(0))
                    .put("logo_url", uniqueFilename)
                    .encode());
              } else {
                // Delete uploaded file if database insert fails
                vertx.fileSystem().delete(finalPath, deleteRes -> {});
                ctx.fail(dbRes.cause());
              }
            });
        } else {
          ctx.fail(moveRes.cause());
        }
      });
    } catch (Exception e) {
      ctx.fail(e);
    }
  }

  private void handleDeletePartner(RoutingContext ctx) {
    String id = ctx.pathParam("id");

    // First get the logo URL to delete the file
    jdbcClient.queryWithParams(
      "SELECT logo_url FROM partenaires WHERE id = ?",
      new JsonArray().add(Integer.parseInt(id)),
      selectRes -> {
        if (selectRes.succeeded() && selectRes.result().getNumRows() > 0) {
          final String filename = selectRes.result().getRows().get(0).getString("logo_url");

          // Delete from database
          jdbcClient.updateWithParams(
            "DELETE FROM partenaires WHERE id = ?",
            new JsonArray().add(Integer.parseInt(id)),
            deleteRes -> {
              if (deleteRes.succeeded()) {
                // Delete file from filesystem
                if (filename != null) {
                  vertx.fileSystem().delete(UPLOAD_DIR + "/" + filename, fileDeleteRes -> {
                    if (fileDeleteRes.failed()) {
                      System.err.println("Failed to delete file: " + filename);
                    }
                  });
                }

                ctx.response()
                  .putHeader("Content-Type", "application/json")
                  .end(new JsonObject().put("success", true).encode());
              } else {
                ctx.fail(deleteRes.cause());
              }
            });
        } else {
          ctx.response().setStatusCode(404).end();
        }
      });
  }

  private boolean isValidFileType(String contentType, String type) {
    switch (type.toLowerCase()) {
      case "image":
        return ALLOWED_IMAGE_TYPES.contains(contentType);
      case "video":
        return ALLOWED_VIDEO_TYPES.contains(contentType);
      case "audio":
        return ALLOWED_AUDIO_TYPES.contains(contentType);
      default:
        return false;
    }
  }

    private void renderTemplate(RoutingContext ctx, JsonObject data, String templatePath) {
    engine.render(data, templatePath, renderRes -> {
      if (renderRes.succeeded()) {
        ctx.response()
          .putHeader("Content-Type", "text/html")
          .end(renderRes.result());
      } else {
        System.err.println("Erreur de rendu du template: " + renderRes.cause().getMessage());
        renderRes.cause().printStackTrace();
        ctx.fail(renderRes.cause());
      }
    });
  }

  private void deleteFileIfExists(String fileUrl) {
    if (fileUrl != null) {
      vertx.fileSystem().delete(UPLOAD_DIR + "/" + fileUrl, deleteRes -> {});
    }
  }
}
