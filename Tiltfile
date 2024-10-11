docker_compose(["./compose.yaml"])

dc_resource("coursemapper-kg-neo4j", labels = ["Backend"])
dc_resource("coursemapper-kg-web", labels = ["Backend"])
dc_resource("mongo", labels = ["Backend"])
dc_resource("proxy", labels = ["Proxy"])
dc_resource("webapp", labels = ["Frontend"])
dc_resource("webserver", labels = ["Backend"])
