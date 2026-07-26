def sixhundred_filter(rid):
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

filter_functions = {
    'sixhundred_filter': sixhundred_filter,
    'samtrans_filter': samtrans_filter,
    'ggt_filter': ggt_filter
}
