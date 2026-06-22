# Reuse class behavior between Alice projects

This tutorial shows how to move one reusable class behavior package from one
Alice project to another and verify that the imported behavior persists.

Use this tutorial when you have a modified Alice class with fields, methods,
constructors, superclass data, and method bodies that should be reused in a
different project.

## Contents

- [What you will make](#what-you-will-make)
- [Before you begin](#before-you-begin)
- [Export the behavior from the first project](#export-the-behavior-from-the-first-project)
- [Import the behavior into the second project](#import-the-behavior-into-the-second-project)
- [Save and reopen the second project](#save-and-reopen-the-second-project)
- [Check the imported behavior](#check-the-imported-behavior)
- [Next reading](#next-reading)

## What you will make

You will export a reusable class behavior named `SpinnerBehavior` from
`MotionLibrary.a3p`, import it into `RobotDance.a3p`, save the second project,
reopen it, and confirm that the class behavior still has the same:

- class name and superclass name
- fields
- methods and functions
- constructors
- method and constructor bodies

The exported file is a JSON package with this extension:

```text
.alice-class-behavior.json
```

## Before you begin

Open Alice in the browser and make sure both projects are available:

- `MotionLibrary.a3p` contains a reusable modified class named
  `SpinnerBehavior`.
- `RobotDance.a3p` is the project that will receive the behavior.

The workflow uses the current Alice project in the browser. It does not ask for
filesystem paths and it does not import code from outside the package data.

The package contains only one `AliceProject.types` entry. It does not bring scene
objects, resource files, project-level methods, referenced external types, or
dependent classes into the receiving project.

## Export the behavior from the first project

1. Open `MotionLibrary.a3p`.
2. In **Class Behaviors**, select `SpinnerBehavior`.
3. Choose **Export class behavior**.
4. Save the downloaded file as:

```text
SpinnerBehavior.alice-class-behavior.json
```

The package contains one `AliceTypeDefinition`. That is the same data model Alice
uses for project types, so the export includes fields, methods, constructors,
superclass information, and method bodies as Alice project data.

## Import the behavior into the second project

1. Open `RobotDance.a3p`.
2. In **Class Behaviors**, choose the `.alice-class-behavior.json` import
   picker.
3. Select `SpinnerBehavior.alice-class-behavior.json`.

If `RobotDance.a3p` does not already have a `SpinnerBehavior` class, the imported
class keeps the name `SpinnerBehavior`.

If the project already has that name, Alice imports the behavior with the next
available name, such as `SpinnerBehavior2`. The imported members and method
bodies are preserved, but only `type.name`, constructor `name`, and constructor
`returnType` are renamed. Method bodies and other references are not rewritten.

## Save and reopen the second project

After importing the behavior:

1. Save `RobotDance.a3p`.
2. Close the project.
3. Reopen `RobotDance.a3p`.
4. Check **Class Behaviors**.
5. Select the imported class behavior.

The class behavior should still appear after reopening the saved project. Alice
writes the imported behavior into the project file through the same project type
data used by normal save and read workflows.

## Check the imported behavior

Inspect the imported class behavior in **Class Behaviors**:

| Item to check | Expected result |
| --- | --- |
| Name | `SpinnerBehavior`, or the renamed value shown after import |
| Superclass | Same superclass name as the exported class |
| Fields | Same field names, types, resource types, and initializers |
| Constructors | Same parameters and body statements |
| Methods | Same method names, parameters, return types, and body statements |

You can also use the class in the receiving project and run the world. The
package contents are never executed during import, but the imported Alice method
data can still refer to resources, type names, superclass names, or self
references that must exist in the receiving project to run correctly.

## Next reading

- [Reusable class behavior workflow](./class-behavior-workflow.md)
- [Class behavior package API](./class-behavior-package-api.md)
- [Class behavior package configuration](./class-behavior-package-configuration.md)

Last updated for reusable Alice class behavior packages.
