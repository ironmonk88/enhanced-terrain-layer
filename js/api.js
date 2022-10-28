import {RuleProvider} from "../classes/ruleprovider.js";
import {i18n} from "../terrain-main.js";

const availableRuleProviders = {};
let currentRuleProvider = undefined;

function register(module, type, ruleProvider) {
    const id = `${type}.${module.id}`;
    const ruleProviderInstance = new ruleProvider(id);
    setupProvider(ruleProviderInstance);
    game.settings.settings.get("enhanced-terrain-layer.rule-provider").config = true;
}

function setupProvider(ruleProvider) {
    availableRuleProviders[ruleProvider.id] = ruleProvider;
    refreshProviderSetting();
    updateRuleProviderVariable();
}

function refreshProviderSetting() {
    const choices = {};
    for (const provider of Object.values(availableRuleProviders)) {
        let dotPosition = provider.id.indexOf(".");
        if (dotPosition === -1) {
            dotPosition = provider.id.length;
        }
        const type = provider.id.substring(0, dotPosition);
        const id = provider.id.substring(dotPosition + 1);
        let text;
        if (type === "bultin") {
            text = i18n("EnhancedTerrainLayer.rule-provider.choices.builtin");
        } else {
            let name;
            if (type === "module") {
                name = game.modules.get(id).title;
            } else {
                name = game.system.title;
            }
            text = game.i18n.format(`EnhancedTerrainLayer.rule-provider.choices.${type}`, {name});
        }
        choices[provider.id] = text;
    }
    game.settings.settings.get("enhanced-terrain-layer.rule-provider").choices = choices;
    game.settings.settings.get("enhanced-terrain-layer.rule-provider").default =
        getDefaultRuleProvider();
}

function getDefaultRuleProvider() {
    const providerIds = Object.keys(availableRuleProviders);

    // Game systems take the highest precedence for the being the default
    const gameSystem = providerIds.find(key => key.startsWith("system."));
    if (gameSystem) return gameSystem;

    // If no game system is registered modules are next up.
    // For lack of a method to select the best module we're just falling back to taking the next best module
    // Object keys should always be sorted the same way so this should achive a stable default
    const module = providerIds.find(key => key.startsWith("module."));
    if (module) return module;

    // If neither a game system or a module is found fall back to the native implementation
    return providerIds[0];
}

export function updateRuleProviderVariable() {
    // If the configured provider is registered use that one. If not use the default provider
    const configuredProvider = game.settings.get("enhanced-terrain-layer", "rule-provider");
    currentRuleProvider =
        availableRuleProviders[configuredProvider] ??
        availableRuleProviders[game.settings.settings.get("enhanced-terrain-layer.rule-provider")];
}

export function initApi() {
    const builtinRuleProviderInstance = new RuleProvider("builtin");
    setupProvider(builtinRuleProviderInstance);
}

export function registerModule(moduleId, ruleProvider) {
    // Check if a module with the given id exists and is currently enabled
    const module = game.modules.get(moduleId);
    // If it doesn't the calling module did something wrong. Log a warning and ignore this module
    if (!module) {
        console.warn(
            `Enhanced Terrain Layer | A module tried to register with the id "${moduleId}". However no active module with this id was found.` +
                "This api registration call was ignored. " +
                "If you are the author of that module please check that the id passed to `registerModule` matches the id in your manifest exactly." +
                "If this call was made form a game system instead of a module please use `registerSystem` instead.",
        );
        return;
    }
    // Using Enhanced Terrain Layer's id is not allowed
    if (moduleId === "enhanced-terrain-layer") {
        console.warn(
            `Enhanced Terrain Layer | A module tried to register with the id "${moduleId}", which is not allowed. This api registration call was ignored. ` +
                "If you're the author of the module please use the id of your own module as it's specified in your manifest to register to this api. " +
                "If this call was made form a game system instead of a module please use `registerSystem` instead.",
        );
        return;
    }

    register(module, "module", ruleProvider);
}

export function registerSystem(systemId, speedProvider) {
    const system = game.system;
    // If the current system id doesn't match the provided id something went wrong. Log a warning and ignore this module
    if (system.id != systemId) {
        console.warn(
            `Drag Ruler | A system tried to register with the id "${systemId}". However the active system has a different id.` +
                "This api registration call was ignored. " +
                "If you are the author of that system please check that the id passed to `registerSystem` matches the id in your manifest exactly." +
                "If this call was made form a module instead of a game system please use `registerModule` instead.",
        );
        return;
    }

    register(system, "system", speedProvider);
}

export function calculateCombinedCost(terrain, options = {}) {
    const cost = currentRuleProvider.calculateCombinedCost(terrain, options);
    // Check if the provider returned a number. If not, log an error and fall back to returning 1
    if (isNaN(cost)) {
        console.error(`The active rule provider returned an invalid cost value: ${cost}`);
        return 1;
    }
    return cost;
}
