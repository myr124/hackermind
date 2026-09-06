"""Throwaway UI prototype server. Run: python3 prototype/serve.py"""
import argparse
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8765)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(root / 'prototype'), **kwargs)

    def do_GET(self):
        if self.path == '/prototype-config.js':
            body = ('window.PROTOTYPE_DEV=' + str(os.getenv('NODE_ENV') != 'production').lower() + ';').encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/javascript')
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()


print(f'Prototype: http://localhost:{args.port}/graph-cards/?variant=A', flush=True)
ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
