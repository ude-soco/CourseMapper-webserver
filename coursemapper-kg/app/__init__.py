from dotenv import load_dotenv
from flask import Blueprint, Flask
from flask_cors import CORS

from app.views.course_materials import course_materials
from app.views.views import view
from config import Config

load_dotenv()


def create_app(config_class=Config):
    app = Flask(__name__)
    # CORS(app)
    
    CORS(app, resources={r"/*": {"origins": "http://localhost:4200"}},
          allow_headers="*",
    supports_credentials=True,
    expose_headers=[
        "tokens",
        "Set-Cookie",
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Credentials",
    ],)
   
    app.config['CORS_HEADERS'] = { 'Content-Type': 'application/json' }

    app.config.from_object(config_class)

    app.register_blueprint(view)
    app.register_blueprint(course_materials)


 

    return app

