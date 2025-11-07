import json
import JsonToCsvConversion as convertToCsv

def createProfiles(data, filename='activitiesProductionOrig.json'):
    with open(filename,"w") as f:
        json.dump(data,f,indent=2)
    convertToCsv.export_to_csv(filename)
