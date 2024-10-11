# from dotenv import load_dotenv

# load_dotenv()

from flask import Flask
from flask_cors import CORS
from app.views.course_materials_service import course_materials
from app.views.rating_resources_service import rating_resources
from app.views.user_resources_service import user_resources
from app.views.helper_service import helper_service


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}},
          allow_headers="*",
    supports_credentials=True,
    expose_headers=[
        "tokens",
        "Set-Cookie",
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Credentials",
    ],)
    app.config['CORS_HEADERS'] = { 'Content-Type': 'application/json' }

    # Register the blueprints with the main app
    app.register_blueprint(course_materials, url_prefix='/recommendation')
    app.register_blueprint(rating_resources, url_prefix='/recommendation/rating')
    app.register_blueprint(user_resources, url_prefix='/recommendation/user_resources')
    app.register_blueprint(helper_service, url_prefix='/recommendation/setting')
    
    return app

# if __name__ == '__main__':
#     app = create_app()
#     app.run(debug=True)
