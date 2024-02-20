import { describe, beforeEach, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

let project = setupProject("app")

describe("packages", () => {
  beforeEach(() => {
    project = setupProject("app")
  })

  describe("app", () => {
    test("detects controllers", async () => {
      expect(project.controllerDefinitions.length).toEqual(0)

      await project.initialize()

      expect(Array.from(project.referencedNodeModules).sort()).toEqual([
        "@hotwired/stimulus",
        "tailwindcss-stimulus-components"
      ])

      expect(project.detectedNodeModules.map(module => module.name).sort()).toEqual([
        "tailwindcss-stimulus-components",
      ])

      // await analyzeAll(project)

      expect(project.detectedNodeModules.map(module => module.name).sort()).toEqual([
        "tailwindcss-stimulus-components",
      ])

      expect(project.controllerRoots).toEqual([
        // "src/controllers",
      ])

      expect(project.guessedControllerRoots).toEqual([
        "src/controllers",
        // "node_modules/@stimulus-library/controllers",
        // "node_modules/stimulus-checkbox/src",
        // "node_modules/stimulus-clipboard/dist",
        // "node_modules/stimulus-datepicker/src",
        // "node_modules/stimulus-dropdown/dist",
        // "node_modules/stimulus-hotkeys/src",
        // "node_modules/stimulus-inline-input-validations/src",
        // "node_modules/stimulus-use/dist",
        "node_modules/tailwindcss-stimulus-components/src",
        // "node_modules/@stimulus-library/mixins/dist",
        // "node_modules/@stimulus-library/utilities/dist",
      ])

      const exportedIdentifiers = [
        "alert",
        // "application",
        "autosave",
        // "base",
        // "click-outside",
        "color-preview",
        // "datepicker",
        "dropdown",
        "hello",
        // "hover",
        // "idle",
        // "index",
        // "index",
        // "input-validator",
        // "install-class-methods",
        // "intersection",
        // "lazy-load",
        "modal",
        // "mutation",
        "popover",
        "slideover", // TODO: this isn't supported yet since this uses an inherited class from another file
        // "resize",
        // "stimulus-clipboard",
        // "stimulus-dropdown",
        "tabs",
        // "target-mutation",
        "toggle",
        // "transition",
        // "use-trix-modifiers",
        // "visibility",
        // "window-focus",
        // "window-resize",
      ]

      expect(project.controllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual([
        "hello",
      ])

      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual([
        "alert",
        "autosave",
        "color-preview",
        "dropdown",
        "hello",
        "modal",
        "popover",
        "slideover",
        "tabs",
        "toggle",
      ])

      await project.refresh()

      // expect(project.detectedNodeModules.map(m => m.inspect)).toEqual([])
      // expect(project.allControllerDefinitions.map(controller => controller.classDeclaration.inspect).sort()).toEqual([])
      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(exportedIdentifiers)

      const allIdentifiers = [
        ...exportedIdentifiers,
        // "click-outside-composable",
        // "debounce",
        // "hover-composable",
        // "idle-composable",
        // "intersection-composable",
        // "lazy-load-composable",
        // "mutation-composable",
        // "resize-composable",
        // "target-mutation-composable",
        // "throttle",
        // "transition-composable",
        // "visibility-composable",
        // "window-focus-composable",
        // "window-resize-composable",
      ].sort()


      // expect(project.detectedNodeModules.map(module => module.inspect)).toEqual(allIdentifiers)
      // expect(project.allSourceFiles.flatMap(sourceFile => sourceFile.controllerDefinitions).map(controller => controller.identifier).sort()).toEqual(allIdentifiers)

      const controller = project.allControllerDefinitions.find(controller => controller.guessedIdentifier === "modal")
      expect(controller.targetNames).toEqual(["container", "background"])
      expect(Object.keys(controller.values)).toEqual(["open", "restoreScroll"])
      expect(controller.values.open.type).toEqual("Boolean")
      expect(controller.values.restoreScroll.type).toEqual("Boolean")

      const sourceFileCount = project.projectFiles.length
      const allSourceFileCount = project.allSourceFiles.length

      expect(sourceFileCount).toEqual(1)
      expect(allSourceFileCount).toEqual(12)

      // re-analyzing shouldn't add source files or controllers twice
      await project.analyze()

      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual([
        "alert",
        "autosave",
        "color-preview",
        "dropdown",
        "hello",
        "modal",
        "popover",
        "slideover",
        "tabs",
        "toggle",
      ])

      await project.analyzeAllDetectedModules()

      expect(project.projectFiles.length).toEqual(sourceFileCount)
      expect(project.allSourceFiles.length).toEqual(allSourceFileCount)
      expect(project.controllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(["hello"])
      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(exportedIdentifiers)
      expect(project.allSourceFiles.flatMap(sourceFile => sourceFile.controllerDefinitions).map(controller => controller.guessedIdentifier).sort()).toEqual(allIdentifiers)
    }, 10_000)

    test("detect all controllers", async () => {
      expect(project.controllerDefinitions.length).toEqual(0)

      await project.initialize()
      await project.detectAvailablePackages()

      expect(Array.from(project.referencedNodeModules).sort()).toEqual([
        "@hotwired/stimulus",
        "tailwindcss-stimulus-components",
      ])

      expect(project.detectedNodeModules.map(module => module.name).sort()).toEqual([
        "@stimulus-library/controllers",
        "@stimulus-library/mixins",
        "@stimulus-library/utilities",
        "@vytant/stimulus-decorators",
        "stimulus-checkbox",
        "stimulus-clipboard",
        "stimulus-datepicker",
        "stimulus-dropdown",
        "stimulus-hotkeys",
        "stimulus-inline-input-validations",
        "stimulus-use",
        "tailwindcss-stimulus-components",
        "tailwindcss-stimulus-components", // TODO: this shouldn't be duplicate
      ])

      expect(project.controllerRoots).toEqual([
        // "src/controllers",
      ])

      expect(project.guessedControllerRoots).toEqual([
        "src/controllers",
        // "node_modules/@stimulus-library/controllers",
        // "node_modules/stimulus-checkbox/src",
        // "node_modules/stimulus-clipboard/dist",
        // "node_modules/stimulus-datepicker/src",
        // "node_modules/stimulus-dropdown/dist",
        // "node_modules/stimulus-hotkeys/src",
        // "node_modules/stimulus-inline-input-validations/src",
        // "node_modules/stimulus-use/dist",
        "node_modules/tailwindcss-stimulus-components/src",
        // "node_modules/@stimulus-library/mixins/dist",
        // "node_modules/@stimulus-library/utilities/dist",
      ])

      const exportedIdentifiers = [
        "alert",
        "application",
        "autosave",
        "base",
        "click-outside",
        "color-preview",
        "datepicker",
        "dropdown",
        "hello",
        "hover",
        "idle",
        "index",
        "index",
        "input-validator",
        "install-class-methods",
        "intersection",
        "lazy-load",
        "modal",
        "mutation",
        "popover",
        "slideover",
        "resize",
        "stimulus-clipboard",
        "stimulus-dropdown",
        "tabs",
        "target-mutation",
        "toggle",
        "transition",
        "use-trix-modifiers",
        "visibility",
        "window-focus",
        "window-resize",
      ]

      expect(project.controllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(["hello"])
      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual([
        "alert",
        "autosave",
        "color-preview",
        "dropdown",
        "hello",
        "modal",
        "popover",
        "slideover",
        "tabs",
        "toggle",
      ])

      await project.analyzeAllDetectedModules()

      const allIdentifiers = [
        "AlertController",
        "AnchorSpyController",
        "ApplicationController",
        "AsyncBlockController",
        "AutoSubmitFormController",
        "AutosizeController",
        "BackLinkController",
        "BaseController",
        "CharCountController",
        "CheckboxDisableInputsController",
        "CheckboxEnableInputsController",
        "CheckboxSelectAllController",
        "CheckboxXORController",
        "ClickOutsideComposableController",
        "ClickOutsideController",
        "ClipboardController",
        "ClockController",
        "ConfirmController",
        "ConfirmNavigationController",
        "CountdownController",
        "Datepicker",
        "DebounceController",
        "DebugController",
        "DetectDirtyController",
        "DetectDirtyFormController",
        "DisableWithController",
        "DismissableController",
        "DurationController",
        "ElementSaveController",
        "EmptyDomController",
        "EnableInputsController",
        "EphemeralController",
        "EqualizeController",
        "FallbackImageController",
        "FocusStealController",
        "FormDirtyConfirmNavigationController",
        "FormRcController",
        "FormSaveController",
        "FullscreenController",
        "HoverComposableController",
        "HoverController",
        "IdleComposableController",
        "IdleController",
        "InstallClassMethodComposableController",
        "IntersectionComposableController",
        "IntersectionController",
        "IntersectionController",
        "IntervalController",
        "LazyBlockController",
        "LazyLoadComposableController",
        "LazyLoadController",
        "LightboxImageController",
        "LimitedSelectionCheckboxesController",
        "LoadBlockController",
        "MediaPlayerController",
        "MutationComposableController",
        "MutationController",
        "NavigateFormErrorsController",
        "NestedFormController",
        "PasswordConfirmController",
        "PasswordPeekController",
        "PersistedDismissableController",
        "PersistedRemoveController",
        "PollBlockController",
        "PrefetchController",
        "PresenceController",
        "PrintButtonController",
        "PrintController",
        "RefreshPageController",
        "RemoteFormController",
        "RemoveController",
        "ResizeComposableController",
        "ResizeController",
        "ResponsiveIframeBodyController",
        "ResponsiveIframeWrapperController",
        "ScrollContainerController",
        "ScrollIntoFocusController",
        "ScrollToBottomController",
        "ScrollToController",
        "ScrollToTopController",
        "SelfDestructController",
        "SignalActionController",
        "SignalBaseController",
        "SignalDisableController",
        "SignalDomChildrenController",
        "SignalEnableController",
        "SignalInputController",
        "SignalVisibilityController",
        "StickyController",
        "SyncInputsController",
        "TableSortController",
        "TableTruncateController",
        "TabsController",
        "TargetMutationComposableController",
        "TargetMutationController",
        "TeleportController",
        "TemporaryStateController",
        "ThrottleController",
        "TimeDistanceController",
        "TimeoutController",
        "ToggleClassController",
        "TransitionComposableController",
        "TransitionController",
        "TreeViewController",
        "TrixComposableController",
        "TrixModifierController",
        "TurboFrameHistoryController",
        "TurboFrameRCController",
        "TurboFrameRefreshController",
        "TweenNumberController",
        "UserFocusController",
        "ValueWarnController",
        "VisibilityComposableController",
        "VisibilityController",
        "WindowFocusComposableController",
        "WindowFocusController",
        "WindowResizeComposableController",
        "WindowResizeController",
        "WordCountController",
        "alert",
        "alert",
        "autosave",
        "autosave",
        "color-preview",
        "color-preview",
        "dropdown",
        "dropdown",
        "hello",
        "i",
        "input-validator",
        "modal",
        "modal",
        "popover",
        "popover",
        "slideover",
        "slideover",
        "stimulus-checkbox",
        "stimulus-hotkeys",
        "t",
        "tabs",
        "tabs",
        "toggle",
        "toggle",
      ]

      expect(project.allControllerDefinitions.map(controller => controller.classDeclaration.className || controller.guessedIdentifier).sort()).toEqual(allIdentifiers)
      expect(project.allSourceFiles.flatMap(sourceFile => sourceFile.controllerDefinitions).map(controller => controller.classDeclaration.className || controller.guessedIdentifier).sort()).toEqual(allIdentifiers)

      const controller = project.allControllerDefinitions.find(controller => controller.guessedIdentifier === "modal")
      expect(controller.targetNames).toEqual(["container", "background"])
      expect(Object.keys(controller.values)).toEqual(["open", "restoreScroll"])
      expect(controller.values.open.type).toEqual("Boolean")
      expect(controller.values.restoreScroll.type).toEqual("Boolean")

      expect(project.projectFiles.length).toEqual(1)
      expect(project.allSourceFiles.length).toEqual(176)
      // const allSourceFiles = project.allSourceFiles.map(s => s.path).sort()

      // re-analyzing shouldn't add source files or controllers twice
      await project.analyze()

      expect(project.allControllerDefinitions.map(controller => controller.classDeclaration.className || controller.guessedIdentifier).sort()).toEqual(allIdentifiers)

      await project.analyzeAllDetectedModules()

      expect(project.projectFiles.length).toEqual(1)
      expect(project.allSourceFiles.length).toEqual(186) // TODO: hotkeys and date-fns are now detected too, ideally we can figure out the right order to get them also the first time around
      // expect(project.allSourceFiles.map(s => s.path).sort()).toEqual(allSourceFiles)

      expect(project.controllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(["hello"])
      expect(project.allControllerDefinitions.map(controller => controller.classDeclaration.className || controller.guessedIdentifier).sort()).toEqual(allIdentifiers)
      expect(project.allSourceFiles.flatMap(sourceFile => sourceFile.controllerDefinitions).map(controller => controller.classDeclaration.className || controller.guessedIdentifier).sort()).toEqual(allIdentifiers)
    }, 10_000)
  })
})
