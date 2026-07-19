import constants

def validate_zone_id(zone: str) -> None:
    """
    Validates if the provided zone ID is correct.

    Args:
        zone (str): The zone ID to validate.

    Raises:
        ValueError: If the zone ID is not valid.
    """
    if zone not in constants.VALID_ZONES:
        raise ValueError(
            f"Invalid zone ID: {zone}. Must be one of {list(constants.VALID_ZONES)}."
        )
