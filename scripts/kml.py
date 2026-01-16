#!/bin/env python
import argparse
import copy
import json

import xml.etree.ElementTree as ET

# register namespace - without this, ElementTree will prepend an 'ns0' to all elements
ET.register_namespace('', "http://www.opengis.net/kml/2.2")

# register cli arguments
parser = argparse.ArgumentParser("kmlprocessor")
parser.add_argument("input", help="kml file to process", type=str)
parser.add_argument("output", help="directory to output processed KML files in", type=str)
parser.add_argument("map", help="map of Folder names to output filenames", type=str)
args = parser.parse_args()

# prepare folder-to-filename map
folder_map = {}
with open(args.map) as mapper:
    folder_map = json.loads(mapper.read())

# get base XML objects
tree = ET.parse(args.input)
root = tree.getroot()

# rewrite styling: we have a local redrawn pin icon to use, and we want to set the scale to look nice
styles = root.findall("./{http://www.opengis.net/kml/2.2}Document/{http://www.opengis.net/kml/2.2}Style")
for style in styles:
    ics = style.find("{http://www.opengis.net/kml/2.2}IconStyle")
    ics.find("{http://www.opengis.net/kml/2.2}scale").text = "0.4"
    ics.find("{http://www.opengis.net/kml/2.2}Icon/{http://www.opengis.net/kml/2.2}href").text = "/assets/pin.png"

# for each KML Folder, delete all folders, copy the remaining one back in, and save to the output directory
folders = root.findall("./{http://www.opengis.net/kml/2.2}Document/{http://www.opengis.net/kml/2.2}Folder")
for f in folders:
    print(f[0].text)
    reduced_tree = copy.deepcopy(tree)
    reduced_root = reduced_tree.getroot()
    doc = reduced_root.find("./{http://www.opengis.net/kml/2.2}Document")
    for child in list(doc):
        if child.tag == '{http://www.opengis.net/kml/2.2}Folder':
            doc.remove(child)
    doc.append(f)
    reduced_tree.write(f'{args.output}/{folder_map[f[0].text]}.kml')