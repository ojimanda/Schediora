from app.api.v1.health import live, ready


def test_live() -> None:
    assert live()['status'] == 'ok'


def test_ready() -> None:
    assert ready()['status'] == 'ready'
