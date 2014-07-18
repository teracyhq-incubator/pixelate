BUILDDIR      = ../_build
DEPLOY_DIR	  = ../_deploy
GH_PAGES_DOMAIN= "pixelate.teracy.com"

html:
	rm -rf $(BUILDDIR)/*
	mkdir -p $(BUILDDIR)/html
	cp -r * $(BUILDDIR)/html
	rm -rf $(BUILDDIR)/html/Makefile $(BUILDDIR)/html/sphinx_deployment.mk $(BUILDDIR)/html/build
	ifdef GH_PAGES_DOMAIN
		echo "$(BUILDDIR)" > $(BUILDDIR)/html/CNAME
	endif

include sphinx_deployment.mk
