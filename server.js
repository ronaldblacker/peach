import express from "express";

const app = express();

const BACKEND_BASE = "http://peacholo.com";
const AREA_NAME = "Dracula";
const FIXED_CONTROLLER = "ClientV3";

app.use(express.raw({
  type: "*/*",
  limit: "20mb"
}));

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Peach Proxy"
  });
});

app.all("/:controller/:action", async (req, res) => {
  try {
    const { controller, action } = req.params;

    if (
      controller.toLowerCase() !==
      FIXED_CONTROLLER.toLowerCase()
    ) {
      return res.status(400).json({
        isSuccessful: false,
        message: "Error."
      });
    }

    const queryIndex = req.originalUrl.indexOf("?");

    const query =
      queryIndex >= 0
        ? req.originalUrl.substring(queryIndex)
        : "";

    const backendUrl =
      `${BACKEND_BASE}/${AREA_NAME}/${FIXED_CONTROLLER}/${action}${query}`;

    console.log("Proxy:", backendUrl);

    const headers = { ...req.headers };

    delete headers.host;
    delete headers["content-length"];
    delete headers.connection;

    const options = {
      method: req.method,
      headers
    };

    if (
      req.method !== "GET" &&
      req.method !== "HEAD" &&
      req.body &&
      req.body.length > 0
    ) {
      options.body = req.body;
    }

    const backendResponse = await fetch(
      backendUrl,
      options
    );

    res.status(backendResponse.status);

    backendResponse.headers.forEach(
      (value, key) => {
        const k = key.toLowerCase();

        if (
          k !== "content-length" &&
          k !== "transfer-encoding" &&
          k !== "connection"
        ) {
          res.setHeader(key, value);
        }
      }
    );

    const body = Buffer.from(
      await backendResponse.arrayBuffer()
    );

    res.send(body);

  } catch (error) {

    console.error(error);

    res.status(502).json({
      isSuccessful: false,
      message: "Error.",
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Peach Proxy running on port ${PORT}`);
});
