r"""
Download the DIBaS dataset via kagglehub with SSL verification disabled.

This machine has a TLS-inspecting antivirus that presents an untrusted cert,
which breaks kagglehub's requests session. We monkeypatch requests' session
send path to skip verification for this public dataset download.

Usage:
  set KAGGLE_API_TOKEN=...   (or kaggle.json in %USERPROFILE%\.kaggle)
  python download_data.py
"""

from __future__ import annotations

import os
import ssl

import requests
import urllib3
from requests.adapters import HTTPAdapter
from urllib3.util.ssl_ import create_urllib3_context

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 1) Disable verification for the stdlib ssl default context too.
ssl._create_default_https_context = ssl._create_unverified_context


class InsecureAdapter(HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):  # type: ignore[override]
        kwargs["ssl_context"] = create_urllib3_context()
        ctx = kwargs["ssl_context"]
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return super().init_poolmanager(*args, **kwargs)

    def send(self, request, **kwargs):  # type: ignore[override]
        kwargs["verify"] = False
        return super().send(request, **kwargs)


def patch_requests() -> None:
    """Patch requests.Session.send to force verify=False for all calls.
    The kagglesdk uses its own requests Session, so we patch the base send."""
    orig_send = requests.Session.send

    def patched_send(self, request, **kwargs):  # type: ignore[override]
        kwargs["verify"] = False
        return orig_send(self, request, **kwargs)

    requests.Session.send = patched_send  # type: ignore[assignment]


def main() -> None:
    token = os.environ.get("KAGGLE_API_TOKEN")
    if not token and not os.path.exists(
        os.path.join(os.path.expanduser("~"), ".kaggle", "kaggle.json")
    ):
        raise SystemExit("No Kaggle credentials found.")

    patch_requests()
    import kagglehub

    p = kagglehub.dataset_download("samaarashidaarbi/dibas-bacterial-colony-dataset")
    print("DOWNLOADED TO:", p)


if __name__ == "__main__":
    main()
