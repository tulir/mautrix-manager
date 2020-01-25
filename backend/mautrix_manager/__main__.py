# mautrix-manager - A web interface for managing bridges
# Copyright (C) 2020 Tulir Asokan
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
import logging.config
import argparse
import asyncio
import signal
import copy
import sys

from .config import Config
from .server import start as start_web, stop as stop_web
from .database import Database
from . import __version__

parser = argparse.ArgumentParser(description="A web interface for managing bridges",
                                 prog="python -m mautrix_manager")
parser.add_argument("-c", "--config", type=str, default="config.yaml",
                    metavar="<path>", help="the path to your config file")
parser.add_argument("-b", "--base-config", type=str, default="example-config.yaml",
                    metavar="<path>", help="the path to the example config "
                                           "(for automatic config updates)")
args = parser.parse_args()

config = Config(args.config, args.base_config)
config.load()
config.update()

logging.config.dictConfig(copy.deepcopy(config["logging"]))

log = logging.getLogger("mau.manager.init")
log.info(f"Initializing maubot {__version__}")

try:
    db = Database(config["server.database"])
except ValueError as e:
    log.fatal(f"Failed to initialize database: {e}")
    sys.exit(10)

loop = asyncio.get_event_loop()

signal.signal(signal.SIGINT, signal.default_int_handler)
signal.signal(signal.SIGTERM, signal.default_int_handler)


async def start():
    log.debug("Connecting to database")
    await db.start()
    await db.create_tables()
    log.debug("Starting up web server")
    await start_web(config)


async def stop():
    log.debug("Cleaning up web server")
    await stop_web()
    log.debug("Closing database connection")
    await db.stop()


try:
    # TODO startup actions
    loop.run_until_complete(start())
    log.info("Startup actions complete, running forever")
    loop.run_forever()
except KeyboardInterrupt:
    # TODO cleanup
    log.info("Received interrupt, stopping...")
    loop.run_until_complete(stop())
    log.debug("Closing event loop")
    loop.close()
    log.debug("Everything stopped, shutting down")
    sys.exit(0)
