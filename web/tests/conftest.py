import pytest
from e2e_helpers import static_server


@pytest.fixture(scope='session')
def shell_server():
    server = static_server()
    yield f'http://127.0.0.1:{server.server_port}'
    server.shutdown()
    server.server_close()
