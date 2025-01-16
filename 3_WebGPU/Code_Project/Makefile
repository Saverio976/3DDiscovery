PYTHON		?=		python3
SRC			=		./
PORT		?=		8080

all:
	$(PYTHON) -m http.server -d "$(SRC)" "$(PORT)"

browser:
	# enable web gpu flag: chrome://flags/#enable-unsafe-webgpu
	chromium --enable-features=Vulkan &
