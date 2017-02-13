#!/bin/bash
apt-get install -y -q  python-dateutil python-magic
wget https://launchpad.net/ubuntu/+archive/primary/+files/s3cmd_1.6.1.orig.tar.gz
tar -xf s3cmd_1.6.1.orig.tar.gz
cd s3cmd-1.6.1
sudo python setup.py install
