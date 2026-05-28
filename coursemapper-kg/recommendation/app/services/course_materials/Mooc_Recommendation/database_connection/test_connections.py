from .coursemapper_connection import CourseMapperConnection
from .mooccentral_connection import MoocCentralConnection
from .mongodb_connection import MongoDBConnection


def test_course_mapper():
    print("Testing CourseMapper connection...")

    db = CourseMapperConnection()

    with db.get_session() as session:
        result = session.run("RETURN 1 AS test")
        print("CourseMapper result:", result.single()["test"])

    db.close()


def test_mooc_central():
    print("Testing MoocCentral connection...")

    db = MoocCentralConnection()

    with db.get_session() as session:
        result = session.run("RETURN 1 AS test")
        print("MoocCentral result:", result.single()["test"])

    db.close()


def test_mongodb():
    print("Testing MongoDB connection...")

    mongo = MongoDBConnection()

    print("Collections:", mongo.db.list_collection_names())

    mongo.close()


if __name__ == "__main__":
    test_course_mapper()
    test_mooc_central()
    test_mongodb()

def test_course_mapper():
    print("Testing CourseMapper...")

    db = CourseMapperConnection()

    with db.get_session() as session:
        result = session.run("RETURN 1 AS test")
        print("CourseMapper result:", result.single()["test"])

    db.close()
    print("CourseMapper connection successful\n")


def test_mooc_central():
    print("Testing MoocCentral...")

    db = MoocCentralConnection()

    with db.get_session() as session:
        result = session.run("RETURN 1 AS test")
        print("MoocCentral result:", result.single()["test"])

    db.close()
    print("MoocCentral connection successful\n")


def test_mongodb():
    print("Testing MongoDB...")

    mongo = MongoDBConnection()

    print("Collections:", mongo.db.list_collection_names())

    mongo.close()
    print("MongoDB connection successful\n")


if __name__ == "__main__":
    test_course_mapper()
    test_mooc_central()
    test_mongodb()