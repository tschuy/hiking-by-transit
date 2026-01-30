import pandas as pd
import zipfile

# map from agency slug to {path, url, annotated_url}
# annotated_url is url used for downloads, including potential fstring for API keys
gtfs_map = {
    "amtrak": {"path": "./gtfs/amtrak.zip", "url": "https://content.amtrak.com/content/gtfs/GTFS.zip"},
    "bear": {"path": "./gtfs/beartransit-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/beartransit-ca-us/beartransit-ca-us.zip"},
    "lake": {"path": "./gtfs/laketransit-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/laketransit-ca-us/laketransit-ca-us.zip"},
    "hta": {"path": "./gtfs/humboldtcounty-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/humboldtcounty-ca-us/humboldtcounty-ca-us.zip"},
    "redwood": {"path": "./gtfs/delnorte-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/delnorte-ca-us/delnorte-ca-us.zip"},
    "mendo": {"path": "./gtfs/mendocino-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/mendocino-ca-us/mendocino-ca-us.zip"},
    "ttd": {"path": "./gtfs/tahoe-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/tahoe-ca-us/tahoe-ca-us.zip"},
    "tart": {"path": "./gtfs/laketahoe-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/laketahoe-ca-us/laketahoe-ca-us.zip"},
    "yolo": {"path": "./gtfs/yolobus.zip", "url": "https://yolobus.com/wp-content/uploads/2025/10/google_transit.zip"},
    "sanbenito": {"path": "./gtfs/sanbenitocounty-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/sanbenitocounty-ca-us/sanbenitocounty-ca-us.zip"},
    "eldorado": {"path": "./gtfs/eldoradotransit-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/eldoradotransit-ca-us/eldoradotransit-ca-us.zip"},
    "bayarea": {"path": "./gtfs/bayarea.zip", "url": "http://api.511.org/transit/datafeeds", "annotated_url": "http://api.511.org/transit/datafeeds?api_key={mtc_api_key}&operator_id=RG"},
    "trinity": {"path": "./gtfs/weaverville-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/weaverville-ca-us/weaverville-ca-us.zip"},
    "siskiyou": {"path": "./gtfs/siskiyou-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/siskiyou-ca-us/siskiyou-ca-us.zip"},
    "sage": {"path": "./gtfs/sagestage-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/sagestage-ca-us/sagestage-ca-us.zip"},
    "nevada": {"path": "./gtfs/goldcountrystage-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/goldcountrystage-ca-us/goldcountrystage-ca-us.zip"},
    "placer": {"path": "./gtfs/placercounty-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/placercounty-ca-us/placercounty-ca-us.zip"},
    "tehama": {"path": "./gtfs/tehama-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/tehama-ca-us/tehama-ca-us.zip"},
    "calaveras": {"path": "./gtfs/calaveras-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/calaveras-ca-us/calaveras-ca-us.zip"},
    "tuolumne": {"path": "./gtfs/tuolumne_ca_us.zip", "url": "https://gtfs.remix.com/tuolumne_ca_us.zip"},
    "amador": {"path": "./gtfs/amador-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/amador-ca-us/amador-ca-us.zip"},
    "eldorado": {"path": "./gtfs/eldoradotransit-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/eldoradotransit-ca-us/eldoradotransit-ca-us.zip"},
    "plumas": {"path": "./gtfs/plumas-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/plumas-ca-us/plumas-ca-us.zip"},
    "yarts": {"path": "./gtfs/yarts.zip", "url": "https://files.mobilitydatabase.org/mdb-2394/mdb-2394-202512250133/mdb-2394-202512250133.zip"},
    "lassen": {"path": "./gtfs/lassen-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/lassen-ca-us/lassen-ca-us.zip"},
    "raba": {"path": "./gtfs/rabagtfs.zip", "url": "https://rabagtfs.z5.web.core.windows.net/rabagtfs.zip"},
    "madera": {"path": "./gtfs/maderactc-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/maderactc-ca-us/maderactc-ca-us.zip"},
    "sanjoaquin": {"path": "./gtfs/rtd-gtfs.zip", "url": "https://sanjoaquinrtd.com/RTD-GTFS/RTD-GTFS.zip"},
    "stanrta": {"path": "./gtfs/stanrta.zip", "url": "https://stanrta.rideralerts.com/InfoPoint/gtfs-zip.ashx"},
    "tulare": {"path": "./gtfs/tulare.zip", "url": "http://data.peaktransit.com/staticgtfs/120/gtfs.zip"},
    "sacrt": {"path": "./gtfs/sacrt.zip", "url": "https://iportal.sacrt.com/gtfs/srtd/google_transit.zip"},
    "butte": {"path": "./gtfs/butte.zip", "url": "https://d16k74nzx9emoe.cloudfront.net/c4326823-2c12-4f59-82f1-3fc4d987e12b/google_transit.zip"},
    "slorta": {"path": "./gtfs/slorta.zip", "url": "http://slo.connexionz.net/rtt/public/resource/gtfs.zip"}
}

def actransit_filter(rid):
    try:
        route = int(rid.split(':')[-1])
        if route >= 600:
            return True
    except ValueError:
        return False

def samtrans_filter(rid):
    try:
        route = int(rid.split(':')[-1])
        if route < 100:
            return True
    except ValueError:
        return False
    
def ggt_filter(rid):
    route = int(rid.split(':')[-1])
    if route not in [101, 130, 150, 580]:
        return True
    return False

# {url -> {route -> {long_name, short_name, type, filter_function}}}
#   type: bus OR rail; bus includes light rail and rail includes ferry
#   filter_function(rid): return True for routes to be hidden for that agency (ex: school routes)
agency_map = {
    "https://iportal.sacrt.com/gtfs/srtd/google_transit.zip": {
        'SRTD': {'type': 'bus', 'long_name': 'Sacramento Regional Transit', 'short_name': 'SacRT'},
    },
    "https://d16k74nzx9emoe.cloudfront.net/c4326823-2c12-4f59-82f1-3fc4d987e12b/google_transit.zip": {
        '97aff62a-ed6d-4bd2-a9c8-d63f8e98a358': {'type': 'bus', 'long_name': 'B-Line'},
    },
    "https://data.trilliumtransit.com/gtfs/lassen-ca-us/lassen-ca-us.zip": {
        81: {'type': 'bus', 'long_name': 'Lassen Rural Bus'},
    },
    "https://rabagtfs.z5.web.core.windows.net/rabagtfs.zip": {
        25: {'type': 'bus', 'long_name': 'Redding Area Bus Authority', 'short_name': 'RABA'},
    },
    "https://data.trilliumtransit.com/gtfs/maderactc-ca-us/maderactc-ca-us.zip": {
        111: {'type': 'bus', 'long_name': 'Madera County Connection'},
    },
    "https://sanjoaquinrtd.com/RTD-GTFS/RTD-GTFS.zip": {
        90012: {'type': 'bus', 'long_name': 'San Joaquin Regional Transit District (RTD)', 'short_name': 'RTD'},
    },
    "https://stanrta.rideralerts.com/InfoPoint/gtfs-zip.ashx": {
        0: {'type': 'bus', 'long_name': 'StanRTA'},
    },
    "http://data.peaktransit.com/staticgtfs/120/gtfs.zip": {
        120: {'type': 'bus', 'long_name': 'Tulare County Regional Transit Agency', 'short_name': 'Tulare'},
    },
    "https://files.mobilitydatabase.org/mdb-2394/mdb-2394-202512250133/mdb-2394-202512250133.zip": {
        114: {
            'type': 'bus',
            'long_name': 'Yosemite Area Regional Transportation System',
            'short_name': 'YARTS',
            'route_notes': {
                '2005': '(SEASONAL SERVICE)',
                '582': '(SEASONAL SERVICE)',
                '1094': '(SEASONAL SERVICE)'
            }
        },
    },
    "https://data.trilliumtransit.com/gtfs/siskiyou-ca-us/siskiyou-ca-us.zip": {
        24: {"short_name": "Siskiyou STAGE", "long_name": "Siskiyou Transit and General Express", "type": "bus"}
    },
    "https://data.trilliumtransit.com/gtfs/weaverville-ca-us/weaverville-ca-us.zip": {
        34: {"long_name": "Trinity Transit", "type": "bus"}
    },
    "https://content.amtrak.com/content/gtfs/GTFS.zip": {
        51: {"long_name": "Amtrak", "type": "rail"}
    },
    "https://data.trilliumtransit.com/gtfs/beartransit-ca-us/beartransit-ca-us.zip": {
        1708: {"long_name": "Bear Transit", "type": "bus"}
    },
    "https://data.trilliumtransit.com/gtfs/sagestage-ca-us/sagestage-ca-us.zip": {
        678: {"long_name": "Sage Stage", "type": "bus"}
    },
    "https://data.trilliumtransit.com/gtfs/laketransit-ca-us/laketransit-ca-us.zip": {
        7: {"short_name": "Lake Transit", "long_name": "Lake Transit", "type": "bus"}
    },
    "https://data.trilliumtransit.com/gtfs/humboldtcounty-ca-us/humboldtcounty-ca-us.zip": {
        "RTS": {"short_name": "HTA", "long_name": "Redwood Transit System", "type": "bus"},
        "ETS": {"short_name": "HTA", "long_name": "Eureka Transit System", "type": "bus"},
        "A&MRTS": {
            "short_name": "HTA",
            "long_name": "Arcata & Mad River Transit System",
            "type": "bus"
        },
        "NSE101": {"short_name": "HTA", "long_name": "North State Express: 101", "type": "bus"},
        "NSE299": {"short_name": "HTA", "long_name": "North State Express: 299", "type": "bus"},
        "SHI": {"short_name": "HTA", "long_name": "Southern Humboldt Line", "type": "bus"},
    },
    "https://data.trilliumtransit.com/gtfs/delnorte-ca-us/delnorte-ca-us.zip": {
        19: {"long_name": "Redwood Coast Transit", "type": "bus"}
    },
    "https://data.trilliumtransit.com/gtfs/mendocino-ca-us/mendocino-ca-us.zip": {
        42: {"short_name": "MTA", "long_name": "Mendocino Transit Authority", "type": "bus"}
    },
    "https://data.trilliumtransit.com/gtfs/tahoe-ca-us/tahoe-ca-us.zip": {
        215: {"short_name": "TTD", "long_name": "Tahoe Transportation District", "type": "bus"}
    },
    "https://data.trilliumtransit.com/gtfs/laketahoe-ca-us/laketahoe-ca-us.zip": {
        16: {
            "short_name": "",
            "long_name": "North Lake Tahoe Express - 24 hour advance reservations required",
            "type": "bus"
        },
        904: {"short_name": "TART", "long_name": "Tahoe Truckee Area Regional Transit", "type": "bus"},
    },
    "https://yolobus.com/wp-content/uploads/2025/10/google_transit.zip": {
        "d139e461-175c-4156-beb0-e6a23b64d978": {
            "short_name": "Yolobus",
            "long_name": "Yolo County Transportation District",
            "type": "bus"
        }
    },
    "https://data.trilliumtransit.com/gtfs/sanbenitocounty-ca-us/sanbenitocounty-ca-us.zip": {
        123: {"long_name": "San Benito County Express", "type": "bus"}
    },
    "https://data.trilliumtransit.com/gtfs/eldoradotransit-ca-us/eldoradotransit-ca-us.zip": {
        261: {"long_name": "El Dorado Transit", "type": "bus"}
    },
    "http://api.511.org/transit/datafeeds": {
        "UC": {"long_name": "Union City Transit", "type": "bus"},
        "PE": {"short_name": "Petaluma", "long_name": "Petaluma", "type": "bus"},
        "PG": {"long_name": "Presidio Go", "type": "bus"},
        "SS": {"short_name": "South City Shuttle", "long_name": "South City Shuttle", "type": "bus"},
        "EE": {"long_name": "Emery Express", "type": "bus"},
        "MC": {"long_name": "Mountain View Community Shuttle", "type": "bus"},
        "SR": {"short_name": "SR", "long_name": "Santa Rosa", "type": "bus"},
        "SF": {"short_name": "Muni", "long_name": "Muni", "type": "bus"},
        "CT": {"long_name": "Caltrain", "type": "rail"},
        "SI": {"long_name": "San Francisco International Airport", "type": "bus"},
        "FS": {"long_name": "FAST", "type": "bus"},
        "WC": {"short_name": "WestCat", "long_name": "WestCat (Western Contra Costa)", "type": "bus"},
        "EM": {"long_name": "Emery Go-Round", "type": "bus"},
        "AC": {"short_name": "AC Transit", "long_name": "AC Transit", "type": "bus", "filter_function": actransit_filter},
        "AF": {"long_name": "Angel Island Tiburon Ferry", "type": "bus"},
        "DE": {"long_name": "Dumbarton Express Consortium", "type": "bus"},
        "CM": {"long_name": "Commute.org Shuttles", "type": "bus"},
        "MB": {"long_name": "Mission Bay TMA", "type": "bus"},
        "WH": {
            "short_name": "Wheels",
            "long_name": "Livermore Amador Valley Transit Authority",
            "type": "bus"
        },
        "SM": {"long_name": "SamTrans", "type": "bus", "filter_function": samtrans_filter},
        "GF": {"long_name": "Golden Gate Ferry", "type": "rail"},
        "VC": {"short_name": "City Coach", "long_name": "Vacaville City Coach", "type": "bus"},
        "GG": {"short_name": "GGT", "long_name": "Golden Gate Transit", "type": "bus", "filter_function": ggt_filter},
        "SA": {"short_name": "SMART", "long_name": "Sonoma Marin Area Rail Transit", "type": "rail"},
        "GP": {"long_name": "San Francisco Recreation and Parks", "type": "bus"},
        "BA": {"short_name": "BART", "long_name": "Bay Area Rapid Transit", "type": "rail"},
        "RV": {"short_name": "Delta Breeze", "long_name": "Rio Vista Delta Breeze", "type": "bus"},
        "TF": {"long_name": "Treasure Island Ferry", "type": "rail"},
        "MV": {"long_name": "MVgo", "type": "bus"},
        "CC": {"short_name": "CC", "long_name": "County Connection", "type": "bus", "filter_function": actransit_filter},
        "SO": {"short_name": "SCT", "long_name": "Sonoma County Transit", "type": "bus"},
        "SC": {"short_name": "VTA", "long_name": "VTA", "type": "bus"},
        "SB": {"long_name": "San Francisco Bay Ferry", "type": "rail"},
        "AM": {
            "short_name": "Capitol Corridor",
            "long_name": "Capitol Corridor Joint Powers Authority",
            "type": "rail"
        },
        "3D": {"short_name": "Tri Delta", "long_name": "Tri Delta Transit", "type": "bus"},
        "MA": {"long_name": "Marin Transit", "type": "bus", "filter_function": actransit_filter},
        "VN": {"long_name": "VINE Transit", "type": "bus"},
        "ST": {"long_name": "SolTrans", "type": "bus"},
        "CE": {"short_name": "ACE", "long_name": "Altamont Corridor Express", "type": "rail"},
    },
    "https://data.trilliumtransit.com/gtfs/goldcountrystage-ca-us/goldcountrystage-ca-us.zip": {
        1523: {'type': 'bus', 'long_name': 'Nevada County Connects'},
    },
    "https://data.trilliumtransit.com/gtfs/placercounty-ca-us/placercounty-ca-us.zip": {
        874: {'type': 'bus', 'long_name': 'Placer County Transit'},
    },
    "https://data.trilliumtransit.com/gtfs/tehama-ca-us/tehama-ca-us.zip": {
        62: {'type': 'bus', 'long_name': 'Susanville Indian Rancheria Public Transportation Program'},
        21: {'type': 'bus', 'long_name': 'Tehama Rural Area Express', 'short_name': 'Tehama TRAX'},
    },
    "https://data.trilliumtransit.com/gtfs/calaveras-ca-us/calaveras-ca-us.zip": {
        79: {'type': 'bus', 'long_name': 'Calaveras Connect'},
    },
    "https://gtfs.remix.com/tuolumne_ca_us.zip": {
        'TCT': {'type': 'bus', 'long_name': 'Tuolumne County Transit'},
    },
    "https://data.trilliumtransit.com/gtfs/amador-ca-us/amador-ca-us.zip": {
        80: {'type': 'bus', 'long_name': 'Amador Transit'},
    },
    "https://data.trilliumtransit.com/gtfs/plumas-ca-us/plumas-ca-us.zip": {
        20: {'type': 'bus', 'long_name': 'Plumas Transit'},
    },
}

# url -> {route_id: route_info}
url_to_route_map = {}

# Populate url_to_route_map
for feed_name, feed_info in gtfs_map.items():
    path = feed_info["path"]
    url = feed_info["url"]
    try:
        with zipfile.ZipFile(path, "r") as zf:
            if "routes.txt" in zf.namelist():
                routes_df = pd.read_csv(zf.open("routes.txt"))
                # Ensure route_id is string
                routes_df["route_id"] = routes_df["route_id"].astype(str)
                route_dict = routes_df.set_index("route_id").T.to_dict()
            else:
                print(f"Warning: {feed_name} has no routes.txt")
                route_dict = {}

        # --- Merge agency route_notes if they exist ---
        if url in agency_map:
            for agency_id, agency_info in agency_map[url].items():
                route_notes = agency_info.get("route_notes", {})
                for rid, note in route_notes.items():
                    rid = str(rid)  # ensure string keys
                    if rid in route_dict:
                        route_dict[rid]["note"] = note
                    else:
                        print(route_dict.keys())
                        print(f"Warning: route_id {rid} in route_notes not found in {feed_name}")

        url_to_route_map[url] = route_dict

    except Exception as e:
        print(f"Error processing {feed_name}: {e}")
        url_to_route_map[url] = {}
