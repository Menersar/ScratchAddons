export default async function ({ addon, console, msg }) {
  const action = addon.settings.get("action");
  let playerToggled = false;
  let scratchStage;
  let sidekickIframeContainer = document.createElement("div");
  sidekickIframeContainer.className = "sa-sidekick-iframe-container";
  let sidekickIframe = document.createElement("iframe");
  sidekickIframe.setAttribute("allowtransparency", "true");
  sidekickIframe.setAttribute("allowfullscreen", "true");
  sidekickIframe.setAttribute(
    "allow",
    // !!!
    // !!!!
    // !!! s CHANGE !!!
    // "autoplay *; camera https://turbowarp.org; document-domain 'none'; fullscreen *; gamepad https://turbowarp.org; microphone https://turbowarp.org;"
    // "autoplay *; camera https://scratch.mit.edu; document-domain 'none'; fullscreen *; gamepad https://scratch.mit.edu; microphone https://scratch.mit.edu;"
    // "autoplay *; camera https://mixality.github.io; document-domain 'none'; fullscreen *; gamepad https://mixality.github.io; microphone https://mixality.github.io;"
    "autoplay *; camera https://menersar.github.io; document-domain 'none'; fullscreen *; gamepad https://menersar.github.io; microphone https://menersar.github.io;"
  );
  sidekickIframe.className = "sa-sidekick-iframe";
  sidekickIframeContainer.appendChild(sidekickIframe);

  const button = document.createElement("button");
  button.className = "button sa-sidekick-button";
  button.title = "Sidekick";

  function removeIframe() {
    sidekickIframeContainer.remove();
    scratchStage.style.display = "";
    button.classList.remove("scratch");
    playerToggled = false;
    button.title = "Sidekick";
  }

  button.onclick = async () => {
    const projectId = window.location.pathname.split("/")[2];
    let search = "";
    if (addon.tab.redux.state?.preview?.projectInfo?.public === false) {
      let projectToken = (
        await (
          await fetch(`https://api.scratch.mit.edu/projects/${projectId}?nocache=${Date.now()}`, {
            headers: {
              "x-token": await addon.auth.fetchXToken(),
            },
          })
        ).json()
      ).project_token;
      search = `#?token=${projectToken}`;
    }
    if (action === "player") {
      playerToggled = !playerToggled;
      if (playerToggled) {
        const username = await addon.auth.fetchUsername();
        const usp = new URLSearchParams();
        usp.set("settings-button", "1");
        if (username) usp.set("username", username);
        if (addon.settings.get("addons")) {
          const enabledAddons = await addon.self.getEnabledAddons("editor");
          usp.set("addons", enabledAddons.join(","));
        }
        // Apply the same fullscreen background color, consistently with the vanilla Scratch fullscreen behavior.
        // It's not expected here to support dynamicDisable/dyanmicEnable of editor-dark-mode to work exactly
        // like it does with vanilla.
        const fullscreenBackground =
          document.documentElement.style.getPropertyValue("--editorDarkMode-fullscreen") || "white";
        usp.set("fullscreen-background", fullscreenBackground);
        // !!! CHANGE !!!
        // const iframeUrl = `https://turbowarp.org/${projectId}/embed?${usp}${search}`;
        // const iframeUrl = `https://mixality.github.io/Sidekick/${projectId}/embed?${usp}${search}`;
        const iframeUrl = `https://menersar.github.io/Sidekick/${projectId}/embed?${usp}${search}`;
        sidekickIframe.src = "";
        scratchStage.parentElement.prepend(sidekickIframeContainer);
        // Use location.replace to avoid creating a history entry
        sidekickIframe.contentWindow.location.replace(iframeUrl);

        scratchStage.style.display = "none";
        button.classList.add("scratch");
        button.title = "Scratch";
        addon.tab.traps.vm.stopAll();
      } else removeIframe();
    } else {
      window.open(
        // !!! CHANGE !!!
        // `https://turbowarp.org/${window.location.pathname.split("/")[2]}${search}`,
        // `https://mixality.github.io/Sidekick/${window.location.pathname.split("/")[2]}${search}`,
        `https://menersar.github.io/Sidekick/${window.location.pathname.split("/")[2]}${search}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  let showAlert = true;
  while (true) {
    const seeInside = await addon.tab.waitForElement(".see-inside-button", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui.mode.isPlayerOnly,
    });

    seeInside.addEventListener("click", function seeInsideClick(event) {
      if (!playerToggled || !showAlert) return;

      if (confirm(msg("confirmation"))) {
        showAlert = false;
      } else {
        event.stopPropagation();
      }
    });

    addon.tab.appendToSharedSpace({ space: "beforeRemixButton", element: button, order: 1 });

    scratchStage = document.querySelector(".guiPlayer");
  }
}
