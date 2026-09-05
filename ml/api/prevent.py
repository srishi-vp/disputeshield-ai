from typing import List


def generate_prevention_actions(
    risk_score: int,
    risk_level: str,
    risk_reasons: List[str],
):
    actions = []

    # =========================================
    # LOW RISK
    # =========================================

    if risk_level == "Low":

        actions.append(
            "Allow the transaction and continue normal monitoring."
        )

        return actions

    # =========================================
    # MEDIUM RISK
    # =========================================

    if risk_level == "Medium":

        actions.append(
            "Review the transaction before taking further action."
        )

        if any(
            "amount" in reason.lower()
            for reason in risk_reasons
        ):
            actions.append(
                "Verify that the transaction amount matches the customer's normal spending pattern."
            )

        if any(
            "velocity" in reason.lower()
            or "transaction activity" in reason.lower()
            for reason in risk_reasons
        ):
            actions.append(
                "Check recent transaction activity for unusual frequency."
            )

        if any(
            "ip" in reason.lower()
            for reason in risk_reasons
        ):
            actions.append(
                "Perform additional verification for the current network or IP risk."
            )

        if any(
            "international" in reason.lower()
            for reason in risk_reasons
        ):
            actions.append(
                "Verify the customer's location and international payment context."
            )

        return actions

    # =========================================
    # HIGH RISK
    # =========================================

    if risk_level == "High":

        actions.append(
            "Require additional customer verification before completing the transaction."
        )

        actions.append(
            "Send the transaction for manual review."
        )

        if any(
            "amount" in reason.lower()
            for reason in risk_reasons
        ):
            actions.append(
                "Verify the unusually large transaction amount."
            )

        if any(
            "velocity" in reason.lower()
            or "transaction activity" in reason.lower()
            for reason in risk_reasons
        ):
            actions.append(
                "Review recent transaction velocity and failed attempts."
            )

        if any(
            "ip" in reason.lower()
            for reason in risk_reasons
        ):
            actions.append(
                "Perform additional verification because of elevated IP risk."
            )

        if any(
            "international" in reason.lower()
            for reason in risk_reasons
        ):
            actions.append(
                "Verify the international transaction context."
            )

        return actions

    return [
        "Review the transaction manually."
    ]