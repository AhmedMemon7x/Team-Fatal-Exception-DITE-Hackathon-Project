"""Railway entry point for the existing single-service deployment stack."""

import os


def main():
    domain = os.environ.get("RAILWAY_PUBLIC_DOMAIN", "").strip().rstrip("/")
    if not domain:
        raise RuntimeError(
            "Generate a Railway public domain before starting the CampusNet service."
        )

    # Reuse the deployment bootstrap used by Render. It normalizes DATABASE_URL,
    # migrates an empty database, creates the initial admin once, and starts the
    # API, measurement endpoint, and periodic rules on Railway's assigned port.
    os.environ["RENDER_EXTERNAL_URL"] = f"https://{domain.removeprefix('https://')}"
    from .render_start import main as start_hosted_service

    start_hosted_service()


if __name__ == "__main__":
    main()
