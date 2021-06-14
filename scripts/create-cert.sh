#!/usr/bin/env bash
openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost,DNS:`hostname`\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
mv localhost.crt ../server/cert/
mv localhost.key ../server/cert/