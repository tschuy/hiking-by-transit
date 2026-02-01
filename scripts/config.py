import pandas as pd
import zipfile
import yaml
import filters
import os

# the following config maps are bad and should be modified to a more
# suitable format.

# agency_map:
# {url -> {route -> {long_name, short_name, type, filter_function}}}
#   type: bus OR rail; bus includes light rail and rail includes ferry
#   filter_function(rid): return True for routes to be hidden for that agency (ex: school routes)

# gtfs_map:
# map from agency slug to {path, url, annotated_url}
# annotated_url is url used for downloads, including potential fstring for API keys
def load_yaml_config(path="../data/config.yml"):
    with open(path) as f:
        return yaml.safe_load(f)

def rebuild_maps_from_yaml(cfg):
    gtfs_map = {}
    agency_map = {}

    feeds = cfg.get("feeds", {})

    for gtfs_key, feed in feeds.items():
        gtfs = feed["gtfs"]
        url = gtfs["url"]

        gtfs_entry = {
            "url": url,
            "path": os.path.abspath(f"../data/gtfs/{gtfs_key}.zip")
        }

        if "annotated_url" in gtfs:
            gtfs_entry["annotated_url"] = gtfs["annotated_url"]

        gtfs_map[gtfs_key] = gtfs_entry

        agency_map[url] = {}

        for agency_id, agency_cfg in feed["agencies"].items():
            rebuilt = {
                "type": agency_cfg["type"],
                "long_name": agency_cfg["long_name"],
            }

            if "short_name" in agency_cfg:
                rebuilt["short_name"] = agency_cfg["short_name"]

            if "routes" in agency_cfg:
                rebuilt["routes"] = agency_cfg["routes"]

            if "filter_function" in agency_cfg:
                fn_name = agency_cfg["filter_function"]

                # Look up function by name in constants module
                fn = filters.filter_functions[fn_name]
                if not callable(fn):
                    raise AssertionError(
                        f"filter_function '{fn_name}' for agency {agency_id} "
                        f"is not callable or not found in filters"
                    )

                rebuilt["filter_function"] = fn

            agency_map[url][agency_id] = rebuilt

    return gtfs_map, agency_map

gtfs_map, agency_map = rebuild_maps_from_yaml(load_yaml_config())

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
                routes = agency_info.get("routes", {})
                for rid in routes.keys():
                    rid = str(rid)  # ensure string keys
                    if rid in route_dict:
                        route_dict[rid]["note"] = routes[rid]["note"]
                    else:
                        print(route_dict.keys())
                        print(f"Warning: route_id {rid} in routes not found in {feed_name}")

        url_to_route_map[url] = route_dict

    except Exception as e:
        print(f"Error processing {feed_name}: {e}")
        url_to_route_map[url] = {}
