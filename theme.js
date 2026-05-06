const THEME_STORAGE_KEY = "medux-ui-theme";
const LANGUAGE_STORAGE_KEY = "medux-ui-language";
const DEFAULT_THEME = "blue";
const ALT_THEME = "berry";
const DEFAULT_LANGUAGE = "en";
const ALT_LANGUAGE = "nl";

const TRANSLATIONS = {
  en: {
    "document.home.title": "Multi-picker Route Planner",
    "document.zv.title": "ZV PATHFINDER",
    "document.wmo.title": "WMO PATHFINDER",
    "document.ams.title": "AMS PATHFINDER",
    "common.logoAlt": "Medux logo",
    "common.backToHome": "Back to home",
    "common.themeToBerry": "Switch to berry palette",
    "common.themeToBlue": "Switch back to blue palette",
    "common.switchToDutch": "Switch to Dutch",
    "common.switchToEnglish": "Switch to English",
    "home.miniLabel": "Distribution routing hub",
    "home.title": "Multi-picker Route Planner",
    "home.subtitleTemplate": "{location}",
    "home.locationLabel": "Location",
    "home.location.zwijndrecht": "Zwijndrecht",
    "home.location.amsterdam": "Amsterdam",
    "home.zvButton": "ZV Pathfinder",
    "home.wmoButton": "WMO Pathfinder",
    "home.amsButton": "AMS Pathfinder",
    "planner.miniLabel": "Multi-picker route planner",
    "legend.free": "Free",
    "legend.start": "Start (S)",
    "legend.stops": "Pick locations",
    "legend.last": "Final drop (L)",
    "legend.path": "Best route",
    "planner.routeGoal": "Route goal",
    "planner.modeLabel": "Planner mode",
    "planner.modeScan": "Scan",
    "planner.modeSelect": "Select",
    "planner.modeResearch": "Research",
    "planner.modeScanPending": "Scan tab is ready. Content coming next.",
    "planner.modeResearchPending": "Research tab is ready. Content coming next.",
    "planner.orderNumber": "Order Number",
    "planner.orderNumberPlaceholder": "Enter order number",
    "planner.scanShowBestRoute": "SHOW BEST ROUTE",
    "planner.scanResetWindow": "RESET WINDOW",
    "planner.zoneConstraint": "Zone constraint",
    "planner.trafficWindow": "Traffic window",
    "planner.showHeatmap": "Show mild traffic heatmap",
    "routeMode.balanced": "Balanced",
    "routeMode.fastest": "Fastest",
    "routeMode.leastTurns": "Least turns",
    "traffic.morning": "Morning",
    "traffic.midday": "Midday",
    "traffic.afternoon": "Afternoon",
    "zone.none": "None",
    "zone.preferTop": "Prefer top zone",
    "zone.preferBottom": "Prefer bottom zone",
    "zone.avoidTop": "Avoid top zone",
    "zone.avoidBottom": "Avoid bottom zone",
    "planner.markFinal": "MARK FINAL DROP",
    "planner.hint": "Tap one free cell for START, then tap pick locations. Use MARK FINAL DROP for the final destination or double-tap a pick location.",
    "planner.summaryEmpty": "Choose a start and pick locations to build a route.",
    "planner.summaryReady": "Route ready. Goal: {mode}. Zone: {zone}. Traffic: {traffic}.",
    "planner.metricDistance": "Distance",
    "planner.metricMeters": "Meters",
    "planner.metricEffort": "Effort",
    "planner.metricTurns": "Turns",
    "planner.metricTime": "Time range",
    "planner.metricEmpty": "-",
    "planner.estimateNote": "Estimates are planning guidance only (not exact distance).",
    "planner.distanceValue": "{value} m",
    "planner.effortValue": "{value} EU",
    "planner.timeMinutesRange": "{min}-{max} min",
    "planner.timeSecondsRange": "{min}-{max} sec",
    "planner.go": "GO",
    "planner.undo": "UNDO LAST PICK",
    "planner.reset": "RESET",
    "reset.title": "Reset options",
    "reset.helper": "Choose what to clear.",
    "reset.routeOnly": "Clear route only",
    "reset.all": "Clear all picks",
    "reset.cancel": "Cancel",
    "status.loading": "Loading stored layout...",
    "status.loaded": "Layout Loaded Successfully",
    "status.fallback": "Could not load {file}; using fallback layout.",
    "status.onlyFree": "Only free cells with value 0 can be selected.",
    "status.startPlaced": "Start placed at ({row}, {col}). Now add pick locations.",
    "status.startCannotBeLast": "The start cell cannot also be the final stop. Choose another cell for L.",
    "status.startLocked": "Start is already locked in. Press RESET to choose a different one.",
    "status.finalDropSet": "Final drop L set at ({row}, {col}). It will be visited last.",
    "status.finalDropRemoved": "Final drop removed from ({row}, {col}).",
    "status.pickRemoved": "Pick location removed from ({row}, {col}).",
    "status.pickAdded": "Pick location {count} added at ({row}, {col}).",
    "status.maxPickLocations": "Maximum pick locations reached ({max}). Remove one before adding more.",
    "status.pickStart": "Pick a start cell first.",
    "status.addDestination": "Add at least one pick location before pressing GO.",
    "status.noRoute": "No full walkable route was found for all selected stops.",
    "status.noRouteHint": "No full walkable route found. Try removing blocked pick locations: {picks}.",
    "status.routeReady": "Route ready.",
    "status.bestRoute": "Best route with {name}. Effort {effort}, time {timeRange}. Goal: {mode}. Zone: {zone}. Traffic: {traffic}.{lastNote}",
    "status.finalLastNote": " Final drop L remains at the end.",
    "status.selectionsCleared": "All selections cleared. Pick a start and add pick locations.",
    "status.routeCleared": "Route cleared. Your selected picks are still kept.",
    "status.finalModeOn": "Final-drop mode enabled. Tap a pick location to set it as L.",
    "status.finalModeOff": "Final-drop mode disabled.",
    "status.zoneConstraintChanged": "Zone constraint updated to: {value}.",
    "status.trafficChanged": "Traffic window updated to: {value}.",
    "status.heatmapOn": "Traffic heatmap enabled.",
    "status.heatmapOff": "Traffic heatmap hidden.",
    "status.nothingToUndo": "No pick locations to undo.",
    "status.orderNumberRequired": "Enter a valid Order Number first.",
    "status.scanRouteBuilt": "Best route generated for order {order} with {count} locations.",
    "status.scanReset": "Scan window reset.",
    "grid.aria": "{size} by {size} interactive pathfinding grid",
    "grid.cellAria": "Row {row}, Column {col}, Value {value}",
    "research.title": "Research mode",
    "research.toggle": "RESEARCH MODE",
    "research.noRun": "No active run",
    "research.activeRun": "Active run: {runId}",
    "research.overallTimer": "Overall timer",
    "research.segmentTimer": "Location timer",
    "research.startRoute": "START ROUTE",
    "research.startPick": "START PICKING STOP",
    "research.endPick": "END PICKING STOP",
    "research.endRoute": "END ROUTE",
    "research.obstruction": "Obstruction",
    "research.obstruction.blockedAisle": "Blocked aisle",
    "research.obstruction.pallet": "Pallet",
    "research.obstruction.personTraffic": "Person traffic",
    "research.obstruction.equipment": "Equipment",
    "research.obstruction.other": "Other",
    "research.logObstruction": "LOG OBSTRUCTION",
    "research.exportCsv": "EXPORT CSV",
    "research.savedCount": "{count} events saved",
    "research.planFirst": "Build and run a route first, then start Research mode.",
    "research.routeStarted": "Research run started: {runId}.",
    "research.routeAlreadyActive": "A research route is already active.",
    "research.noActiveRoute": "No active research route.",
    "research.markStopFirst": "Mark a stop on the grid first.",
    "research.stopMarked": "Stop {stop} marked at ({row}, {col}).",
    "research.stopAlreadyMarked": "Stop {stop} is already marked.",
    "research.pickStarted": "Picking started at stop {stop}.",
    "research.pickEnded": "Picking ended at stop {stop}.",
    "research.pickAlreadyStarted": "Picking is already active for this stop.",
    "research.pickNotStarted": "Start picking before ending it.",
    "research.obstructionLogged": "Obstruction logged: {category}.",
    "research.routeEnded": "Research route completed. Total completed routes: {count}.",
    "research.routeAborted": "Research route aborted.",
    "research.confirmCloseAndRestart": "A research route is active. Close it as aborted and calculate a new route?",
    "research.noDataToExport": "No research data to export yet.",
    "research.exported": "CSV exported ({count} events): {file}",
    "research.autoExported": "Auto-export completed ({count} events): {file}",
    "research.storageSaveFailed": "Could not save research data in local storage."
  },
  nl: {
    "document.home.title": "Multi-picker Routeplanner",
    "document.zv.title": "ZV PATHFINDER",
    "document.wmo.title": "WMO PATHFINDER",
    "document.ams.title": "AMS PATHFINDER",
    "common.logoAlt": "Medux-logo",
    "common.backToHome": "Terug naar start",
    "common.themeToBerry": "Wissel naar bessentint",
    "common.themeToBlue": "Wissel terug naar blauw palet",
    "common.switchToDutch": "Overschakelen naar Nederlands",
    "common.switchToEnglish": "Overschakelen naar Engels",
    "home.miniLabel": "Routehub distributiecentrum",
    "home.title": "Multi-picker Routeplanner",
    "home.subtitleTemplate": "{location}",
    "home.locationLabel": "Locatie",
    "home.location.zwijndrecht": "Zwijndrecht",
    "home.location.amsterdam": "Amsterdam",
    "home.zvButton": "ZV Pathfinder",
    "home.wmoButton": "WMO Pathfinder",
    "home.amsButton": "AMS Pathfinder",
    "planner.miniLabel": "Routeplanner voor meerdere orderpickers",
    "legend.free": "Vrij",
    "legend.start": "Start (S)",
    "legend.stops": "Picklocaties",
    "legend.last": "Einddrop (L)",
    "legend.path": "Beste route",
    "planner.routeGoal": "Routedoel",
    "planner.modeLabel": "Plannermodus",
    "planner.modeScan": "Scan",
    "planner.modeSelect": "Selecteer",
    "planner.modeResearch": "Onderzoek",
    "planner.modeScanPending": "Scan-tab staat klaar. Inhoud volgt hierna.",
    "planner.modeResearchPending": "Onderzoek-tab staat klaar. Inhoud volgt hierna.",
    "planner.orderNumber": "Ordernummer",
    "planner.orderNumberPlaceholder": "Voer ordernummer in",
    "planner.scanShowBestRoute": "TOON BESTE ROUTE",
    "planner.scanResetWindow": "VENSTER RESETTEN",
    "planner.zoneConstraint": "Zonebeperking",
    "planner.trafficWindow": "Druktevenster",
    "planner.showHeatmap": "Toon milde drukte-heatmap",
    "routeMode.balanced": "Gebalanceerd",
    "routeMode.fastest": "Snelste",
    "routeMode.leastTurns": "Minste bochten",
    "traffic.morning": "Ochtend",
    "traffic.midday": "Middag",
    "traffic.afternoon": "Namiddag",
    "zone.none": "Geen",
    "zone.preferTop": "Voorkeur bovenzone",
    "zone.preferBottom": "Voorkeur onderzone",
    "zone.avoidTop": "Vermijd bovenzone",
    "zone.avoidBottom": "Vermijd onderzone",
    "planner.markFinal": "MARKEER EINDDROP",
    "planner.hint": "Tik op een vrije cel voor de START en tik daarna picklocaties. Gebruik MARKEER EINDDROP voor de eindlocatie of dubbeltik op een picklocatie.",
    "planner.summaryEmpty": "Kies een start en picklocaties om een route te bouwen.",
    "planner.summaryReady": "Route klaar. Doel: {mode}. Zone: {zone}. Drukte: {traffic}.",
    "planner.metricDistance": "Afstand",
    "planner.metricMeters": "Meters",
    "planner.metricEffort": "Inspanning",
    "planner.metricTurns": "Bochten",
    "planner.metricTime": "Tijdsrange",
    "planner.metricEmpty": "-",
    "planner.estimateNote": "Schattingen zijn alleen planningshulp (geen exacte afstand).",
    "planner.distanceValue": "{value} m",
    "planner.effortValue": "{value} EU",
    "planner.timeMinutesRange": "{min}-{max} min",
    "planner.timeSecondsRange": "{min}-{max} sec",
    "planner.go": "PLAN",
    "planner.undo": "LAATSTE PICK ONGEDAAN",
    "planner.reset": "RESET",
    "reset.title": "Resetopties",
    "reset.helper": "Kies wat je wilt wissen.",
    "reset.routeOnly": "Alleen route wissen",
    "reset.all": "Alle picks wissen",
    "reset.cancel": "Annuleren",
    "status.loading": "Opgeslagen layout wordt geladen...",
    "status.loaded": "Layout succesvol geladen",
    "status.fallback": "Kon {file} niet laden; fallback-layout wordt gebruikt.",
    "status.onlyFree": "Alleen vrije cellen met waarde 0 kunnen worden geselecteerd.",
    "status.startPlaced": "Start geplaatst op ({row}, {col}). Voeg nu picklocaties toe.",
    "status.startCannotBeLast": "De startcel kan niet ook de laatste stop zijn. Kies een andere cel voor L.",
    "status.startLocked": "De start staat al vast. Druk op RESET om een andere te kiezen.",
    "status.finalDropSet": "Einddrop L ingesteld op ({row}, {col}). Deze wordt als laatste bezocht.",
    "status.finalDropRemoved": "Einddrop verwijderd van ({row}, {col}).",
    "status.pickRemoved": "Picklocatie verwijderd van ({row}, {col}).",
    "status.pickAdded": "Picklocatie {count} toegevoegd op ({row}, {col}).",
    "status.maxPickLocations": "Maximum picklocaties bereikt ({max}). Verwijder eerst een locatie.",
    "status.pickStart": "Kies eerst een startcel.",
    "status.addDestination": "Voeg minstens een picklocatie toe voordat je op GO drukt.",
    "status.noRoute": "Er kon geen volledige looproute voor alle geselecteerde stops worden gevonden.",
    "status.noRouteHint": "Geen volledige route gevonden. Probeer geblokkeerde picklocaties te verwijderen: {picks}.",
    "status.routeReady": "Route klaar.",
    "status.bestRoute": "Beste route met {name}. Inspanning {effort}, tijd {timeRange}. Doel: {mode}. Zone: {zone}. Drukte: {traffic}.{lastNote}",
    "status.finalLastNote": " Einddrop L blijft aan het einde.",
    "status.selectionsCleared": "Alle selecties gewist. Kies een start en voeg picklocaties toe.",
    "status.routeCleared": "Route gewist. Je gekozen picks blijven behouden.",
    "status.finalModeOn": "Einddrop-modus aan. Tik op een picklocatie om L te zetten.",
    "status.finalModeOff": "Einddrop-modus uit.",
    "status.zoneConstraintChanged": "Zonebeperking aangepast naar: {value}.",
    "status.trafficChanged": "Druktevenster aangepast naar: {value}.",
    "status.heatmapOn": "Drukte-heatmap ingeschakeld.",
    "status.heatmapOff": "Drukte-heatmap verborgen.",
    "status.nothingToUndo": "Geen picklocaties om ongedaan te maken.",
    "status.orderNumberRequired": "Voer eerst een geldig ordernummer in.",
    "status.scanRouteBuilt": "Beste route gegenereerd voor order {order} met {count} locaties.",
    "status.scanReset": "Scanvenster gereset.",
    "grid.aria": "{size} bij {size} interactief pathfinding-raster",
    "grid.cellAria": "Rij {row}, kolom {col}, waarde {value}",
    "research.title": "Onderzoeksmodus",
    "research.toggle": "ONDERZOEKSMODUS",
    "research.noRun": "Geen actieve run",
    "research.activeRun": "Actieve run: {runId}",
    "research.overallTimer": "Totale timer",
    "research.segmentTimer": "Locatietimer",
    "research.startRoute": "START ROUTE",
    "research.startPick": "START PICKSTOP",
    "research.endPick": "EIND PICKSTOP",
    "research.endRoute": "EIND ROUTE",
    "research.obstruction": "Obstructie",
    "research.obstruction.blockedAisle": "Geblokkeerd pad",
    "research.obstruction.pallet": "Pallet",
    "research.obstruction.personTraffic": "Persoonsverkeer",
    "research.obstruction.equipment": "Materieel",
    "research.obstruction.other": "Overig",
    "research.logObstruction": "LOG OBSTRUCTIE",
    "research.exportCsv": "EXPORTEER CSV",
    "research.savedCount": "{count} events opgeslagen",
    "research.planFirst": "Bouw en plan eerst een route en start daarna de onderzoeksmodus.",
    "research.routeStarted": "Onderzoeksrun gestart: {runId}.",
    "research.routeAlreadyActive": "Er is al een actieve onderzoeksroute.",
    "research.noActiveRoute": "Geen actieve onderzoeksroute.",
    "research.markStopFirst": "Markeer eerst een stop op het raster.",
    "research.stopMarked": "Stop {stop} gemarkeerd op ({row}, {col}).",
    "research.stopAlreadyMarked": "Stop {stop} is al gemarkeerd.",
    "research.pickStarted": "Picken gestart bij stop {stop}.",
    "research.pickEnded": "Picken gestopt bij stop {stop}.",
    "research.pickAlreadyStarted": "Picken is al gestart voor deze stop.",
    "research.pickNotStarted": "Start eerst met picken voordat je stopt.",
    "research.obstructionLogged": "Obstructie gelogd: {category}.",
    "research.routeEnded": "Onderzoeksroute afgerond. Totaal afgeronde routes: {count}.",
    "research.routeAborted": "Onderzoeksroute afgebroken.",
    "research.confirmCloseAndRestart": "Er is een actieve onderzoeksroute. Sluiten als afgebroken en een nieuwe route berekenen?",
    "research.noDataToExport": "Nog geen onderzoeksdata om te exporteren.",
    "research.exported": "CSV geëxporteerd ({count} events): {file}",
    "research.autoExported": "Automatische export voltooid ({count} events): {file}",
    "research.storageSaveFailed": "Onderzoeksdata kon niet lokaal worden opgeslagen."
  }
};

function normalizeTheme(themeName) {
  return themeName === ALT_THEME ? ALT_THEME : DEFAULT_THEME;
}

function normalizeLanguage(languageName) {
  return languageName === ALT_LANGUAGE ? ALT_LANGUAGE : DEFAULT_LANGUAGE;
}

function formatMessage(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ""));
}

function getStoredLanguage() {
  try {
    return normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE);
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function translate(key, params = {}) {
  const language = normalizeLanguage(document.documentElement.lang || getStoredLanguage());
  const activeTranslations = TRANSLATIONS[language] || TRANSLATIONS[DEFAULT_LANGUAGE];
  const fallback = TRANSLATIONS[DEFAULT_LANGUAGE][key] ?? key;
  return formatMessage(activeTranslations[key] ?? fallback, params);
}

function updateThemeToggleButton(themeName) {
  const toggleButton = document.querySelector("[data-theme-toggle]");
  if (!toggleButton) {
    return;
  }

  const isBlue = themeName === DEFAULT_THEME;
  toggleButton.textContent = isBlue ? "◐" : "◑";

  const label = translate(isBlue ? "common.themeToBerry" : "common.themeToBlue");
  toggleButton.setAttribute("title", label);
  toggleButton.setAttribute("aria-label", label);
}

function updateLanguageToggleButton(languageName) {
  const toggleButton = document.querySelector("[data-language-toggle]");
  if (!toggleButton) {
    return;
  }

  toggleButton.textContent = languageName === DEFAULT_LANGUAGE ? "NL" : "EN";

  const label = translate(languageName === DEFAULT_LANGUAGE ? "common.switchToDutch" : "common.switchToEnglish");
  toggleButton.setAttribute("title", label);
  toggleButton.setAttribute("aria-label", label);
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = translate(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.setAttribute("title", translate(element.dataset.i18nTitle));
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", translate(element.dataset.i18nAriaLabel));
  });

  document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
    element.setAttribute("alt", translate(element.dataset.i18nAlt));
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", translate(element.dataset.i18nPlaceholder));
  });
}

function applyTheme(themeName) {
  const normalizedTheme = normalizeTheme(themeName);

  document.documentElement.dataset.theme = normalizedTheme;
  if (document.body) {
    document.body.dataset.theme = normalizedTheme;
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
  } catch {
    // Ignore storage issues and still apply the theme visually.
  }

  updateThemeToggleButton(normalizedTheme);
}

function applyLanguage(languageName) {
  const normalizedLanguage = normalizeLanguage(languageName);

  document.documentElement.lang = normalizedLanguage;
  if (document.body) {
    document.body.dataset.language = normalizedLanguage;
  }

  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage);
  } catch {
    // Ignore storage issues and still apply the language visually.
  }

  applyTranslations();
  updateThemeToggleButton(normalizeTheme(document.documentElement.dataset.theme || DEFAULT_THEME));
  updateLanguageToggleButton(normalizedLanguage);
  window.dispatchEvent(new CustomEvent("medux:languagechange", { detail: { language: normalizedLanguage } }));
}

function getSelectedHomeLocation() {
  const locationSelect = document.getElementById("homeLocationSelect");
  if (locationSelect) {
    return locationSelect.value;
  }

  const activeOption = document.querySelector("[data-home-location-option].is-active");
  if (activeOption?.dataset.homeLocationOption) {
    return activeOption.dataset.homeLocationOption;
  }

  return "zwijndrecht";
}

function setSelectedHomeLocation(locationValue) {
  const toggleContainer = document.getElementById("homeLocationToggle");
  const options = Array.from(document.querySelectorAll("[data-home-location-option]"));

  options.forEach((option) => {
    const isActive = option.dataset.homeLocationOption === locationValue;
    option.classList.toggle("is-active", isActive);
    option.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  if (toggleContainer) {
    toggleContainer.dataset.location = locationValue;
  }
}

function updateHomeActionsByLocation() {
  const selectedLocation = getSelectedHomeLocation();
  document.querySelectorAll("[data-home-locations]").forEach((linkElement) => {
    const allowedLocations = String(linkElement.dataset.homeLocations || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const isAllowed = allowedLocations.includes(selectedLocation);

    if (!linkElement.dataset.originalHref) {
      linkElement.dataset.originalHref = linkElement.getAttribute("href") || "";
    }

    linkElement.hidden = false;
    linkElement.setAttribute("aria-disabled", isAllowed ? "false" : "true");
    linkElement.tabIndex = isAllowed ? 0 : -1;
    linkElement.classList.toggle("is-allowed", isAllowed);
    linkElement.classList.toggle("is-blocked", !isAllowed);

    if (isAllowed) {
      if (linkElement.dataset.originalHref) {
        linkElement.setAttribute("href", linkElement.dataset.originalHref);
      }
      return;
    }

    linkElement.removeAttribute("href");
  });
}

function syncHomeLocationUI() {
  updateHomeActionsByLocation();
}

function setupHomeLocationSelector() {
  const locationSelect = document.getElementById("homeLocationSelect");
  const locationOptions = Array.from(document.querySelectorAll("[data-home-location-option]"));

  if (!locationSelect && !locationOptions.length) {
    return;
  }

  if (locationSelect) {
    locationSelect.addEventListener("change", syncHomeLocationUI);
  }

  if (locationOptions.length) {
    locationOptions.forEach((option) => {
      option.addEventListener("click", () => {
        setSelectedHomeLocation(option.dataset.homeLocationOption || "zwijndrecht");
        syncHomeLocationUI();
      });
    });
  }

  window.addEventListener("medux:languagechange", syncHomeLocationUI);
  syncHomeLocationUI();
}

window.__meduxTranslate = translate;
window.__meduxSetLanguage = applyLanguage;
window.__meduxGetLanguage = getStoredLanguage;

document.addEventListener("DOMContentLoaded", () => {
  let savedTheme = DEFAULT_THEME;
  let savedLanguage = DEFAULT_LANGUAGE;

  try {
    savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
  } catch {
    savedTheme = DEFAULT_THEME;
  }

  try {
    savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE;
  } catch {
    savedLanguage = DEFAULT_LANGUAGE;
  }

  applyTheme(savedTheme);
  applyLanguage(savedLanguage);
  setupHomeLocationSelector();

  const themeButton = document.querySelector("[data-theme-toggle]");
  if (themeButton) {
    themeButton.addEventListener("click", () => {
      const currentTheme = document.body.dataset.theme === ALT_THEME ? ALT_THEME : DEFAULT_THEME;
      applyTheme(currentTheme === DEFAULT_THEME ? ALT_THEME : DEFAULT_THEME);
    });
  }

  const languageButton = document.querySelector("[data-language-toggle]");
  if (languageButton) {
    languageButton.addEventListener("click", () => {
      const currentLanguage = document.documentElement.lang === ALT_LANGUAGE ? ALT_LANGUAGE : DEFAULT_LANGUAGE;
      applyLanguage(currentLanguage === DEFAULT_LANGUAGE ? ALT_LANGUAGE : DEFAULT_LANGUAGE);
    });
  }
});
