import "./App.css";

import React, { useState, useEffect, createContext, useContext } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  TextField,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link as MuiLink,
} from "@mui/material";
import {
  ContentCopy as ContentCopyIcon,
  InfoOutlined as InfoOutlinedIcon,
} from "@mui/icons-material";

// --- Context for URL data and "logging" ---
const URLContext = createContext();

export const URLProvider = ({ children }) => {
  const [shortenedURLs, setShortenedURLs] = useState([]);
  const [logs, setLogs] = useState([]); // Simplified "logging middleware"

  // Function to simulate logging
  const logEvent = (type, message, data = {}) => {
    const newLog = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
    };
    setLogs((prevLogs) => [...prevLogs, newLog]);
    console.log(`[LOG - ${type}] ${message}`, data); // For demonstration
  };

  const addShortenedURL = (newURL) => {
    setShortenedURLs((prevURLs) => [...prevURLs, newURL]);
    logEvent("URL_SHORTENED", "A new URL was shortened", newURL);
  };

  const updateClickCount = (shortcode) => {
    setShortenedURLs((prevURLs) =>
      prevURLs.map((url) =>
        url.shortcode === shortcode
          ? {
              ...url,
              clicks: url.clicks + 1,
              clickDetails: [
                ...url.clickDetails,
                {
                  timestamp: new Date().toISOString(),
                  source: "Client-side navigation", // Simulated source
                  location: "Hyderabad, India", // Simulated location
                },
              ],
            }
          : url
      )
    );
    logEvent("URL_CLICKED", `Shortcode ${shortcode} was clicked`);
  };

  return (
    <URLContext.Provider
      value={{
        shortenedURLs,
        addShortenedURL,
        updateClickCount,
        logs,
        logEvent,
      }}
    >
      {children}
    </URLContext.Provider>
  );
};

// --- Utility Functions ---

// Simple URL validation regex
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Generates a random alphanumeric shortcode
const generateShortcode = (length = 6) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// --- Components ---

const URLInputForm = ({ onShorten }) => {
  const [originalUrl, setOriginalUrl] = useState("");
  const [validity, setValidity] = useState(""); // in minutes
  const [customShortcode, setCustomShortcode] = useState("");
  const [errors, setErrors] = useState({});
  const { shortenedURLs } = useContext(URLContext);

  const validate = () => {
    const newErrors = {};
    if (!originalUrl) {
      newErrors.originalUrl = "Original URL is required.";
    } else if (!isValidUrl(originalUrl)) {
      newErrors.originalUrl = "Invalid URL format.";
    }

    if (validity && (isNaN(validity) || parseInt(validity) <= 0)) {
      newErrors.validity = "Validity must be a positive number of minutes.";
    }

    if (customShortcode) {
      if (!/^[a-zA-Z0-9]+$/.test(customShortcode)) {
        newErrors.customShortcode = "Custom shortcode must be alphanumeric.";
      } else if (
        shortenedURLs.some((url) => url.shortcode === customShortcode)
      ) {
        newErrors.customShortcode = "This shortcode is already taken.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onShorten({ originalUrl, validity, customShortcode });
      setOriginalUrl("");
      setValidity("");
      setCustomShortcode("");
      setErrors({});
    }
  };

  return (
    <Paper
      elevation={3}
      style={{ padding: "20px", marginBottom: "20px", borderRadius: "8px" }}
    >
      <Typography variant="h6" gutterBottom>
        Shorten a New URL
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Original URL"
              variant="outlined"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              error={!!errors.originalUrl}
              helperText={errors.originalUrl}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Validity Period (minutes, optional)"
              variant="outlined"
              type="number"
              value={validity}
              onChange={(e) => setValidity(e.target.value)}
              error={!!errors.validity}
              helperText={errors.validity}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Custom Shortcode (optional)"
              variant="outlined"
              value={customShortcode}
              onChange={(e) => setCustomShortcode(e.target.value)}
              error={!!errors.customShortcode}
              helperText={errors.customShortcode}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              style={{ borderRadius: "4px" }}
            >
              Shorten URL
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

const ShortenedURLDisplay = ({ urlData }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { logEvent } = useContext(URLContext);

  const handleCopy = () => {
    const shortUrl = `${window.location.origin}/short/${urlData.shortcode}`;
    document.execCommand("copy", false, shortUrl); // Using document.execCommand for iFrame compatibility
    setSnackbarOpen(true);
    logEvent("COPY_SHORT_URL", `Copied short URL: ${shortUrl}`);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const expiryDate = urlData.expiry
    ? new Date(urlData.expiry).toLocaleString()
    : "Never";

  return (
    <Paper
      elevation={2}
      style={{ padding: "15px", marginBottom: "10px", borderRadius: "8px" }}
    >
      <ListItem disableGutters>
        <ListItemText
          primary={
            <MuiLink
              href={`/short/${urlData.shortcode}`}
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = `/short/${urlData.shortcode}`; // Client-side redirection
              }}
              target="_blank"
              rel="noopener noreferrer"
              color="primary"
              style={{ wordBreak: "break-all" }}
            >
              {`${window.location.origin}/short/${urlData.shortcode}`}
            </MuiLink>
          }
          secondary={
            <>
              <Typography component="span" variant="body2" color="textPrimary">
                Original: {urlData.originalUrl}
              </Typography>
              <br />
              <Typography
                component="span"
                variant="body2"
                color="textSecondary"
              >
                Expires: {expiryDate}
              </Typography>
            </>
          }
        />
        <IconButton edge="end" aria-label="copy" onClick={handleCopy}>
          <ContentCopyIcon />
        </IconButton>
      </ListItem>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          Short URL copied to clipboard!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

const StatisticsTable = ({ stats }) => {
  const [selectedURL, setSelectedURL] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleViewDetails = (url) => {
    setSelectedURL(url);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedURL(null);
  };

  return (
    <Paper elevation={3} style={{ padding: "20px", borderRadius: "8px" }}>
      <Typography variant="h6" gutterBottom>
        Shortened URL Statistics
      </Typography>
      {stats.length === 0 ? (
        <Typography variant="body1" color="textSecondary">
          No shortened URLs to display yet.
        </Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Short URL</TableCell>
                <TableCell>Original URL</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Expires At</TableCell>
                <TableCell align="right">Clicks</TableCell>
                <TableCell align="center">Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.map((url) => (
                <TableRow key={url.shortcode}>
                  <TableCell>
                    <MuiLink
                      href={`/short/${url.shortcode}`}
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.hash = `/short/${url.shortcode}`; // Client-side redirection
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="primary"
                      style={{ wordBreak: "break-all" }}
                    >
                      {`${window.location.origin}/short/${url.shortcode}`}
                    </MuiLink>
                  </TableCell>
                  <TableCell style={{ wordBreak: "break-all" }}>
                    {url.originalUrl}
                  </TableCell>
                  <TableCell>
                    {new Date(url.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {url.expiry
                      ? new Date(url.expiry).toLocaleString()
                      : "Never"}
                  </TableCell>
                  <TableCell align="right">{url.clicks}</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleViewDetails(url)}>
                      <InfoOutlinedIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selectedURL && (
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Click Details for {selectedURL.shortcode}</DialogTitle>
          <DialogContent dividers>
            <Typography variant="subtitle1" gutterBottom>
              Original URL: {selectedURL.originalUrl}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Total Clicks: {selectedURL.clicks}
            </Typography>
            {selectedURL.clickDetails.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No click details available.
              </Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Location</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedURL.clickDetails.map((detail, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(detail.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>{detail.source}</TableCell>
                        <TableCell>{detail.location}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  );
};

const URLShortenerPage = () => {
  const { shortenedURLs, addShortenedURL, logEvent } = useContext(URLContext);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const handleShortenURL = ({ originalUrl, validity, customShortcode }) => {
    let shortcode = customShortcode;
    if (!shortcode) {
      // Generate a unique shortcode
      do {
        shortcode = generateShortcode();
      } while (shortenedURLs.some((url) => url.shortcode === shortcode));
    }

    const createdAt = new Date().toISOString();
    const validityMinutes = parseInt(validity) || 30; // Default to 30 minutes
    const expiry = new Date(
      new Date().getTime() + validityMinutes * 60 * 1000
    ).toISOString();

    const newURL = {
      id: Date.now(), // Unique ID for React key
      originalUrl,
      shortcode,
      createdAt,
      expiry,
      clicks: 0,
      clickDetails: [],
    };

    addShortenedURL(newURL);
    setSnackbarMessage("URL shortened successfully!");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
    logEvent("URL_SHORTENED_SUCCESS", "Successfully shortened URL", newURL);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="md" style={{ marginTop: "20px" }}>
      <URLInputForm onShorten={handleShortenURL} />

      <Typography variant="h6" gutterBottom style={{ marginTop: "30px" }}>
        Your Shortened URLs (Max 5)
      </Typography>
      {shortenedURLs.length === 0 ? (
        <Typography variant="body1" color="textSecondary">
          No URLs shortened yet. Use the form above!
        </Typography>
      ) : (
        <List>
          {shortenedURLs.slice(-5).map(
            (
              url // Display last 5
            ) => (
              <ShortenedURLDisplay key={url.id} urlData={url} />
            )
          )}
        </List>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

const URLStatisticsPage = () => {
  const { shortenedURLs } = useContext(URLContext);

  return (
    <Container maxWidth="lg" style={{ marginTop: "20px" }}>
      <StatisticsTable stats={shortenedURLs} />
    </Container>
  );
};

const RedirectHandler = ({ updateClickCount, shortenedURLs, logEvent }) => {
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#/short/")) {
        const shortcode = hash.substring(8); // Remove '#/short/'
        const url = shortenedURLs.find((u) => u.shortcode === shortcode);
        if (url) {
          updateClickCount(shortcode);
          logEvent(
            "REDIRECT_SUCCESS",
            `Redirecting from shortcode ${shortcode} to ${url.originalUrl}`
          );
          window.location.replace(url.originalUrl); // Redirect to original URL
        } else {
          logEvent(
            "REDIRECT_FAILED",
            `Shortcode ${shortcode} not found for redirection`
          );
          // Optionally, show an error message or redirect to a 404 page
          console.error(`Shortcode ${shortcode} not found.`);
          // Redirect to home if shortcode not found
          window.location.hash = "/";
        }
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    // Initial check on load
    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [shortenedURLs, updateClickCount, logEvent]);

  return null; // This component doesn't render anything visible
};

const App = () => {
  const [currentPage, setCurrentPage] = useState("shortener"); // 'shortener' or 'statistics'
  const { shortenedURLs, updateClickCount, logEvent } = useContext(URLContext);

  // Simple client-side router based on hash
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.hash.substring(1); // Remove '#'
      if (path === "/statistics") {
        setCurrentPage("statistics");
      } else if (path.startsWith("/short/")) {
        // Handled by RedirectHandler, but ensure main page doesn't show
        setCurrentPage("redirecting");
      } else {
        setCurrentPage("shortener");
      }
    };

    window.addEventListener("hashchange", handleRouteChange);
    handleRouteChange(); // Initial route check

    return () => {
      window.removeEventListener("hashchange", handleRouteChange);
    };
  }, []);

  return (
    <>
      {/* Tailwind CSS CDN - Not allowed per instructions, but typically included */}
      {/* <script src="https://cdn.tailwindcss.com"></script> */}
      <AppBar
        position="static"
        style={{ backgroundColor: "#2196f3", borderRadius: "0 0 8px 8px" }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            URL Shortener
          </Typography>
          <Button
            color="inherit"
            onClick={() => (window.location.hash = "/")}
            style={{ borderRadius: "4px" }}
          >
            Shortener
          </Button>
          <Button
            color="inherit"
            onClick={() => (window.location.hash = "/statistics")}
            style={{ borderRadius: "4px" }}
          >
            Statistics
          </Button>
        </Toolbar>
      </AppBar>
      <RedirectHandler
        updateClickCount={updateClickCount}
        shortenedURLs={shortenedURLs}
        logEvent={logEvent}
      />
      {currentPage === "shortener" && <URLShortenerPage />}
      {currentPage === "statistics" && <URLStatisticsPage />}
      {currentPage === "redirecting" && (
        <Container style={{ textAlign: "center", marginTop: "50px" }}>
          <Typography variant="h5">Redirecting...</Typography>
          <Typography variant="body1">
            If you are not redirected, the shortcode might be invalid.
          </Typography>
        </Container>
      )}
    </>
  );
};

// Wrap App with URLProvider
const AppWrapper = () => (
  <URLProvider>
    <App />
  </URLProvider>
);

export default AppWrapper;
