docker_compose(["./compose.yaml"])

dc_resource("proxy", labels = ["Proxy"])
dc_resource("webapp", labels = ["Frontend"])
dc_resource("webserver", labels = ["Backend"])
dc_resource("mongo", labels = ["Backend"])
