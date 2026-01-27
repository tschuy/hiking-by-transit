import pandas as pd
import zipfile

gtfs_map = {
    "lake": {"path": "./gtfs/laketransit-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/laketransit-ca-us/laketransit-ca-us.zip"},
    "hta": {"path": "./gtfs/humboldtcounty-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/humboldtcounty-ca-us/humboldtcounty-ca-us.zip"},
    "redwood": {"path": "./gtfs/delnorte-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/delnorte-ca-us/delnorte-ca-us.zip"},
    "mendo": {"path": "./gtfs/mendocino-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/mendocino-ca-us/mendocino-ca-us.zip"},
    "ttd": {"path": "./gtfs/tahoe-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/tahoe-ca-us/tahoe-ca-us.zip"},
    "tart": {"path": "./gtfs/laketahoe-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/laketahoe-ca-us/laketahoe-ca-us.zip"},
    "yolo": {"path": "./gtfs/yolobus.zip", "url": "https://yolobus.com/wp-content/uploads/2025/10/google_transit.zip"},
    "sanbenito": {"path": "./gtfs/sanbenitocounty-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/sanbenitocounty-ca-us/sanbenitocounty-ca-us.zip"},
    "eldorado": {"path": "./gtfs/eldoradotransit-ca-us.zip", "url": "https://data.trilliumtransit.com/gtfs/eldoradotransit-ca-us/eldoradotransit-ca-us.zip"},
    "bayarea": {"path": "./gtfs/bayarea.zip", "url": "http://api.511.org/transit/datafeeds"}
}

# Dictionary mapping URL -> {route_id: route_info}
url_to_route_map = {}

for feed_name, feed_info in gtfs_map.items():
    try:
        path = feed_info["path"]
        url = feed_info["url"]

        with zipfile.ZipFile(path, 'r') as zf:
            if "routes.txt" in zf.namelist():
                routes_df = pd.read_csv(zf.open("routes.txt"))
                # Create a dict mapping route_id -> row as dict
                routes_df["route_id"] = routes_df["route_id"].astype(str)
                route_dict = routes_df.set_index("route_id").T.to_dict()
                url_to_route_map[url] = route_dict
            else:
                print(f"Warning: {feed_name} has no routes.txt")
                url_to_route_map[url] = {}
    except Exception as e:
        print(f"Error processing {feed_name}: {e}")
        url_to_route_map[url] = {}

agency_map = {
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
        "AC": {"short_name": "AC Transit", "long_name": "AC Transit", "type": "bus"},
        "AF": {"long_name": "Angel Island Tiburon Ferry", "type": "bus"},
        "DE": {"long_name": "Dumbarton Express Consortium", "type": "bus"},
        "CM": {"long_name": "Commute.org Shuttles", "type": "bus"},
        "MB": {"long_name": "Mission Bay TMA", "type": "bus"},
        "WH": {
            "short_name": "Wheels",
            "long_name": "Livermore Amador Valley Transit Authority",
            "type": "bus"
        },
        "SM": {"long_name": "SamTrans", "type": "bus"},
        "GF": {"long_name": "Golden Gate Ferry", "type": "rail"},
        "VC": {"short_name": "City Coach", "long_name": "Vacaville City Coach", "type": "bus"},
        "GG": {"short_name": "GGT", "long_name": "Golden Gate Transit", "type": "bus"},
        "SA": {"short_name": "SMART", "long_name": "Sonoma Marin Area Rail Transit", "type": "bus"},
        "GP": {"long_name": "San Francisco Recreation and Parks", "type": "bus"},
        "BA": {"short_name": "BART", "long_name": "Bay Area Rapid Transit", "type": "rail"},
        "RV": {"short_name": "Delta Breeze", "long_name": "Rio Vista Delta Breeze", "type": "bus"},
        "TF": {"long_name": "Treasure Island Ferry", "type": "rail"},
        "MV": {"long_name": "MVgo", "type": "bus"},
        "CC": {"short_name": "CC", "long_name": "County Connection", "type": "bus"},
        "SO": {"short_name": "SCT", "long_name": "Sonoma County Transit", "type": "bus"},
        "SC": {"short_name": "VTA", "long_name": "VTA", "type": "bus"},
        "SB": {"long_name": "San Francisco Bay Ferry", "type": "rail"},
        "AM": {
            "short_name": "Capitol Corridor",
            "long_name": "Capitol Corridor Joint Powers Authority",
            "type": "bus"
        },
        "3D": {"short_name": "Tri Delta", "long_name": "Tri Delta Transit", "type": "bus"},
        "MA": {"long_name": "Marin Transit", "type": "bus"},
        "VN": {"long_name": "VINE Transit", "type": "bus"},
        "ST": {"long_name": "SolTrans", "type": "bus"},
        "CE": {"short_name": "ACE", "long_name": "Altamont Corridor Express", "type": "rail"},
    },
}
