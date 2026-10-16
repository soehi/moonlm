#!/usr/bin/env python3
"""Assemble the browser demo into `web/dist/` and optionally serve it.

Two outputs, both self-contained:

  * `web/dist/` — `index.html` plus the MoonBit-compiled `web.js`. This is what
    gets deployed or shown. It makes no network requests, so the page works
    with the network off.

  * The same directory served over loopback, for the browser check and for
    local use. A `file://` page cannot load an ES module (`CORS` blocks it), so
    the page must be served over HTTP even though nothing else needs a server.

The server binds 127.0.0.1 only: this is a local preview for a page that ships
its engine as a static file, and binding a wider interface would expose it on
the network for no reason.
"""
import argparse
import http.server
import os
import shutil
import socket
import socketserver
import subprocess
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(REPO, "web")
DIST = os.path.join(WEB, "dist")
BUNDLE = os.path.join(REPO, "_build", "js", "release", "build", "web", "web.js")


def compile_engine():
    """Compile the MoonBit web package for the `js` target."""
    print("[1/2] building the MoonBit web package (release, js target)")
    subprocess.run(
        ["moon", "build", "src/web", "--target", "js", "--release"],
        cwd=REPO, check=True, shell=False)
    if not os.path.isfile(BUNDLE):
        raise SystemExit(f"expected build output is missing: {BUNDLE}")


def assemble():
    """Copy the page and the compiled bundle into `web/dist/`.

    Separate from the compile step so `--skip-build` can skip only the MoonBit
    build: editing `index.html` should reach `dist/` without recompiling the
    engine, which is the common case while iterating on the page.
    """
    print("[2/2] assembling web/dist/")
    os.makedirs(DIST, exist_ok=True)
    shutil.copy2(os.path.join(WEB, "index.html"), os.path.join(DIST, "index.html"))
    if not os.path.isfile(BUNDLE):
        raise SystemExit(
            f"web.js is missing: {BUNDLE}\nrun without --skip-build to compile it")
    shutil.copy2(BUNDLE, os.path.join(DIST, "web.js"))
    print(f"  web/dist/index.html")
    print(f"  web/dist/web.js  ({os.path.getsize(os.path.join(DIST, 'web.js')) / 1024:.0f} KB)")


class Handler(http.server.SimpleHTTPRequestHandler):
    """Static file handler that reports failures instead of only logging them."""

    # Filled in by `serve()`: directory to resolve `--model-dir` URLs against.
    model_dir = None

    def translate_path(self, path):
        """Resolve a `/models/...` URL against the model directory, if given.

        The demo can read a model either from a file input or from a URL. The
        URL path exists for local use and for the automated browser check (the
        in-app browser cannot drive a file picker), and it stays inside the
        configured directory: `SimpleHTTPRequestHandler` already normalizes
        `..`, and this joins only after that normalization.
        """
        if self.model_dir and path.startswith("/models/"):
            import urllib.parse
            rel = urllib.parse.unquote(path[len("/models/"):])
            rel = rel.replace("\\", "/").lstrip("/")
            candidate = os.path.normpath(os.path.join(self.model_dir, rel))
            root = os.path.normpath(self.model_dir)
            # Reject anything that escaped the configured directory.
            if candidate == root or candidate.startswith(root + os.sep):
                return candidate
            return os.path.join(root, "__rejected__")
        return super().translate_path(path)

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))

    def end_headers(self):
        # The demo is meant to be inspectable in DevTools; caching would hide
        # whether a reload picked up a rebuild.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def pick_port(preferred):
    """Return `preferred` if it is free, otherwise an ephemeral port."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(("127.0.0.1", preferred))
            return preferred
        except OSError:
            pass
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def serve(port, model_dir=None):
    os.chdir(DIST)
    Handler.model_dir = model_dir
    with socketserver.TCPServer(("127.0.0.1", port), Handler) as httpd:
        httpd.allow_reuse_address = True
        print(f"\nserving http://127.0.0.1:{port}/  (Ctrl+C to stop)")
        print("open that URL, pick a .gguf file, and press 生成")
        if model_dir:
            print(f"models from {model_dir} are available under /models/")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped")


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--port", type=int, default=8000,
                    help="preferred port on 127.0.0.1 (default 8000)")
    ap.add_argument("--no-serve", action="store_true",
                    help="only assemble web/dist/, do not start a server")
    ap.add_argument("--skip-build", action="store_true",
                    help="reuse the existing web.js instead of rebuilding")
    ap.add_argument("--model-dir", default=None,
                    help="directory to expose read-only under /models/, so the "
                         "page can load a model by URL instead of a file picker")
    args = ap.parse_args()

    if not args.skip_build:
        compile_engine()
    assemble()
    if args.no_serve:
        print(f"\nweb/dist/ ready; serve it yourself, e.g.\n"
              f"  python -m http.server {args.port} --bind 127.0.0.1 -d {DIST}")
        return 0
    model_dir = os.path.abspath(args.model_dir) if args.model_dir else None
    if model_dir and not os.path.isdir(model_dir):
        raise SystemExit(f"--model-dir is not a directory: {model_dir}")
    serve(pick_port(args.port), model_dir)
    return 0


if __name__ == "__main__":
    sys.exit(main())
