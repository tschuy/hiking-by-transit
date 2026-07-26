import unittest

from trailhead_names import destination_candidates, parse_trailhead_name


class TrailheadNameTests(unittest.TestCase):
    def test_standalone_trailhead_has_no_destination(self):
        self.assertEqual(parse_trailhead_name("Howard Trail").destination_names, ())

    def test_standalone_park_is_a_destination(self):
        self.assertEqual(parse_trailhead_name("Howard Regional Park").destination_names, ("Howard Regional Park",))

    def test_named_entrance(self):
        parsed = parse_trailhead_name("Johnson Regional Park: Secondary Dr")
        self.assertEqual(parsed.destination_names, ("Johnson Regional Park",))
        self.assertEqual(parsed.entrance_name, "Secondary Dr")

    def test_multiple_destinations(self):
        parsed = parse_trailhead_name("Johnson Regional Park / McMaster Preserve: Reginald Trail")
        self.assertEqual(parsed.destination_names, ("Johnson Regional Park", "McMaster Preserve"))
        self.assertEqual(parsed.entrance_name, "Reginald Trail")

    def test_unspaced_slash_is_preserved_inside_destination_name(self):
        parsed = parse_trailhead_name("Johnson Park/Preserve: Reginald Trail")
        self.assertEqual(parsed.destination_names, ("Johnson Park/Preserve",))

    def test_slash_after_colon_stays_in_entrance_name(self):
        parsed = parse_trailhead_name("Garin Regional Park: CSU East Bay / Harder Rd")
        self.assertEqual(parsed.destination_names, ("Garin Regional Park",))
        self.assertEqual(parsed.entrance_name, "CSU East Bay / Harder Rd")

    def test_known_long_distance_trail_can_stand_alone(self):
        known = destination_candidates(["National Forest / Pacific Crest Trail: Trailhead"])
        self.assertEqual(parse_trailhead_name("Pacific Crest Trail", known).destination_names, ("Pacific Crest Trail",))

    def test_empty_entrance_is_rejected(self):
        with self.assertRaises(ValueError):
            parse_trailhead_name("Johnson Regional Park:")


if __name__ == "__main__":
    unittest.main()
