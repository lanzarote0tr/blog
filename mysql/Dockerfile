FROM mysql:8.4
USER root

RUN set -eux; \
    microdnf install -y gettext; \
    microdnf clean all
