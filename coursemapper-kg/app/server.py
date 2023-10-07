from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, threaded=True, processes=4)

# if __name__ == '__main__':
#     app = create_app()
#     with app.app_context():
#         app.run(host="0.0.0.0", debug=True)