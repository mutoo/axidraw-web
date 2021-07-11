#!/usr/bin/env bash

CERT_DIR=`dirname $0`/../server/cert
FILENAME_CA_KEY=ca.key
FILENAME_CA_CERT=ca.pem
FILENAME_CERT_KEY=localhost.key
FILENAME_CERT_CSR=localhost.csr
FILENAME_CERT_EXT=localhost.ext
FILENAME_CERT_CERT=localhost.crt

# create cert folder
mkdir -p $CERT_DIR
cd $CERT_DIR

if [ ! -f "$FILENAME_CA_CERT" ]; then
  # generate ca key
  openssl genrsa -out $FILENAME_CA_KEY 2048
  # create ca root cert
  openssl req -x509 -new -nodes -key $FILENAME_CA_KEY -sha256 -days 365 -out $FILENAME_CA_CERT
fi

if [ ! -f "$FILENAME_CERT_KEY" ]; then
  # generate cert key
  openssl genrsa -out $FILENAME_CERT_KEY 2048
fi

# create csr
openssl req -new -nodes -key $FILENAME_CERT_KEY -out $FILENAME_CERT_CSR
# create ext config
> $FILENAME_CERT_EXT cat <<-EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names
[alt_names] 
DNS.1 = localhost
DNS.2 = $(hostname)
DNS.3 = $(hostname).local
DNS.4 = $(ipconfig getifaddr en0)
EOF
# signed cert
openssl x509 -req -in $FILENAME_CERT_CSR -CA $FILENAME_CA_CERT -CAkey $FILENAME_CA_KEY -CAcreateserial -out $FILENAME_CERT_CERT -days 365 -sha256 -extfile $FILENAME_CERT_EXT

# done
echo "cert is created! please add and trust the $FILENAME_CA_CERT to your browser"
