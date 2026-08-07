"""Pre-download ImageNet weights with SSL verification disabled.

The local AV intercepts TLS, so torchvision's download fails. We fetch the
file ourselves into the torch hub cache; torchvision then loads it locally.
"""

from __future__ import annotations

import os
import ssl
import urllib.request

URL = "https://download.pytorch.org/models/resnet18-f37072fd.pth"
DEST = os.path.join(
    os.path.expanduser("~"), ".cache", "torch", "hub", "checkpoints", "resnet18-f37072fd.pth"
)


def main() -> None:
    if os.path.exists(DEST) and os.path.getsize(DEST) > 10_000_000:
        print(f"Already present: {DEST} ({os.path.getsize(DEST)} bytes)")
        return
    os.makedirs(os.path.dirname(DEST), exist_ok=True)
    ssl._create_default_https_context = ssl._create_unverified_context
    print(f"Downloading {URL} -> {DEST}")
    urllib.request.urlretrieve(URL, DEST)
    print(f"Done: {os.path.getsize(DEST)} bytes")


if __name__ == "__main__":
    main()
