import json
from pathlib import Path

def export_to_csv(filename):
    with open(filename) as f:
        list1 = []
        data = json.loads(f.read())
        print(data[0])
        temp = data[0]
        header_items = []
        get_header_items(header_items, temp)
        list1.append(header_items)
      
        for obj in data:
            d = []
            add_items_to_data(d, obj)
            list1.append(d)
        
        with open('activitiesProductionOrig.csv', 'w') as output_file:
            for a in list1:
                output_file.write(','.join(map(str, a)) + "\r")


def get_header_items(items, obj):
    for x in obj:
        #print(obj)
        if isinstance(obj[x], dict):

            #items.append(x)
            #print(obj[x])

            get_header_items(items, obj[x])
        else:
            items.append(x)
            #print(x)


def add_items_to_data(items, obj):
    for x in obj:
        if isinstance(obj[x], dict):
            #items.append("")
            add_items_to_data(items, obj[x])
        else:
            items.append(obj[x])