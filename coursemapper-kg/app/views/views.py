from flask import Blueprint, current_app


view = Blueprint("view", __name__)


@view.route("/")
def home():
    secret_key = current_app.config.get("SECRET_KEY") # type: ignore
    return f"Hello world! Stanford: {secret_key}"
