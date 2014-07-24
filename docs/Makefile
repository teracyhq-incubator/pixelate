BUILDDIR      = ../_build
DEPLOY_DIR	  = ../_deploy
GH_PAGES_DOMAIN=pixelate.teracy.org
SHELL = /bin/bash

html:
	rm -rf $(BUILDDIR)/*
	mkdir -p $(BUILDDIR)/html
	cp -r demo/* $(BUILDDIR)/html
	if [ "" == "$(GH_PAGES_DOMAIN)" ]; then \
		if [ -f "$(BUILDDIR)/html/CNAME" ]; then \
			rm -f "$(BUILDDIR)/html/CNAME"; \
		fi \
	else \
		echo "$(GH_PAGES_DOMAIN)" > "$(BUILDDIR)/html/CNAME"; \
	fi

include sphinx_deployment.mk
