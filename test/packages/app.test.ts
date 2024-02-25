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

      expect(project.detectedNodeModules.map(module => module.name).sort()).toEqual(["tailwindcss-stimulus-components"])
      expect(Array.from(project.controllerRoots)).toEqual(["src/controllers"])
      expect(project.guessedControllerRoots).toEqual([
        "src/controllers",
        "node_modules/tailwindcss-stimulus-components/src",
      ])

      const exportedIdentifiers = [
        "alert",
        "autosave",
        "color-preview",
        "custom-modal",
        "dropdown",
        "hello",
        "modal",
        "parent",
        "popover",
        "slideover",
        "tabs",
        "toggle",
      ]

      expect(project.registeredControllers.map(controller => controller.identifier).sort()).toEqual(["custom-modal", "hello"])
      expect(project.controllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(["custom-modal", "hello"])
      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(exportedIdentifiers)

      await project.refresh()

      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(exportedIdentifiers)

      const controller = project.allControllerDefinitions.find(controller => controller.guessedIdentifier === "modal")
      expect(controller.targetNames).toEqual(["container", "background"])
      expect(controller.valueNames).toEqual(["open", "restoreScroll"])
      expect(controller.valueDefinitionsMap.open.type).toEqual("Boolean")
      expect(controller.valueDefinitionsMap.restoreScroll.type).toEqual("Boolean")

      const sourceFileCount = project.projectFiles.length
      const allSourceFileCount = project.allSourceFiles.length

      expect(sourceFileCount).toEqual(4)
      expect(allSourceFileCount).toEqual(15)

      // re-analyzing shouldn't add source files or controllers twice
      await project.analyze()

      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(exportedIdentifiers)

      await project.analyzeAllDetectedModules()

      expect(project.projectFiles.length).toEqual(sourceFileCount)
      expect(project.allSourceFiles.length).toEqual(allSourceFileCount)
      expect(project.controllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(["custom-modal", "hello"])
      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(exportedIdentifiers)
      expect(project.allSourceFiles.flatMap(sourceFile => sourceFile.controllerDefinitions).map(controller => controller.guessedIdentifier).sort()).toEqual(exportedIdentifiers)
    })

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
      ])

      expect(Array.from(project.controllerRoots)).toEqual(["src/controllers"])

      expect(project.guessedControllerRoots).toEqual([
        "src/controllers",
        "node_modules/tailwindcss-stimulus-components/src",
      ])

      expect(project.controllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(["custom-modal", "hello"])
      expect(project.allControllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual([
        "alert",
        "autosave",
        "color-preview",
        "custom-modal",
        "dropdown",
        "hello",
        "modal",
        "parent",
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
        "ParentController",
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
        "autosave",
        "color-preview",
        "custom-modal",
        "dropdown",
        "hello",
        "i",
        "input-validator",
        "modal",
        "popover",
        "slideover",
        "stimulus-checkbox",
        "stimulus-hotkeys",
        "t",
        "tabs",
        "toggle",
      ]

      expect(project.allControllerDefinitions.map(controller => controller.classDeclaration.className || controller.guessedIdentifier).sort()).toEqual(allIdentifiers)
      expect(project.allSourceFiles.flatMap(sourceFile => sourceFile.controllerDefinitions).map(controller => controller.classDeclaration.className || controller.guessedIdentifier).sort()).toEqual(allIdentifiers)

      const controller = project.allControllerDefinitions.find(controller => controller.guessedIdentifier === "modal")
      expect(controller.targetNames).toEqual(["container", "background"])
      expect(controller.valueNames).toEqual(["open", "restoreScroll"])
      expect(controller.valueDefinitionsMap.open.type).toEqual("Boolean")
      expect(controller.valueDefinitionsMap.restoreScroll.type).toEqual("Boolean")

      expect(project.projectFiles.length).toEqual(4)
      expect(project.allSourceFiles.length).toEqual(168)
      const allSourceFiles = project.allSourceFiles.map(s => s.path).sort()

      // re-analyzing shouldn't add source files or controllers twice
      await project.analyze()

      expect(project.allControllerDefinitions.map(controller => controller.classDeclaration.className || controller.guessedIdentifier).sort()).toEqual(allIdentifiers)

      await project.analyzeAllDetectedModules()

      expect(project.projectFiles.length).toEqual(4)
      expect(project.allSourceFiles.length).toEqual(168)
      expect(project.allSourceFiles.map(s => s.path).sort()).toEqual(allSourceFiles)

      expect(project.controllerDefinitions.map(controller => controller.guessedIdentifier).sort()).toEqual(["custom-modal", "hello"])
      expect(project.allControllerDefinitions.map(controller => controller.classDeclaration.className || controller.guessedIdentifier).sort()).toEqual(allIdentifiers)
      expect(project.allSourceFiles.flatMap(sourceFile => sourceFile.controllerDefinitions).map(controller => controller.classDeclaration.className || controller.guessedIdentifier).sort()).toEqual(allIdentifiers)
    })
  })
})
