#!/usr/bin/env bash
# create cert folder
CERT_DIR=`dirname $0`/../server/cert
mkdir -p $CERT_DIR
cd $CERT_DIR
# genearte ca key
openssl genrsa -out ca.key 2048
# create ca root cert
openssl req -x509 -new -nodes -key ca.key -sha256 -days 365 -out ca.pem
# generate cert key
openssl genrsa -out localhost.key 2048
# create csr
openssl req -new -nodes -key localhost.key -out localhost.csr
# create ext config
> localhost.ext cat <<-EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names
[alt_names] 
DNS.1 = localhost
DNS.2 = $(hostname)
DNS.3 = $(hostname).local
EOF
# signed cert
openssl x509 -req -in localhost.csr -CA ca.pem -CAkey ca.key -CAcreateserial -out localhost.crt -days 365 -sha256 -extfile localhost.ext
# done
echo "cert is created! please add and trust the ca.pem to your browser"
