from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import amplihack_cli


class AmplihackCliTests(unittest.TestCase):
    def test_install_uses_ignore_scripts_and_vitest_uses_locked_local_exec(self) -> None:
        commands: list[tuple[list[str], Path, dict[str, str] | None]] = []
        tools: list[str] = []
        repo = Path("/repo")

        def fake_run(command: list[str], cwd: Path, env: dict[str, str] | None = None) -> None:
            commands.append((command, cwd, env))

        with (
            mock.patch.object(amplihack_cli, "ensure_checkout", return_value=repo),
            mock.patch.object(amplihack_cli, "ensure_tool", side_effect=tools.append),
            mock.patch.object(amplihack_cli, "run", side_effect=fake_run),
            mock.patch.dict(os.environ, {"NODE_OPTIONS": "--trace-warnings"}, clear=True),
        ):
            result = amplihack_cli.main(["a3p-statement-simple"])

        self.assertEqual(result, 0)
        self.assertEqual(tools, ["npm"])
        self.assertEqual(
            commands[0],
            (["npm", "ci", "--ignore-scripts", "--no-audit", "--no-fund", "--silent"], repo, None),
        )
        self.assertEqual(commands[1][0][:5], ["npm", "exec", "--no", "--", "vitest"])
        self.assertEqual(commands[1][0][5:8], ["run", "test/a3p-writer.test.ts", "-t"])
        self.assertIn("keeps writer", commands[1][0][8])
        self.assertEqual(commands[1][1], repo)
        self.assertEqual(commands[1][2]["NODE_OPTIONS"], "--max-old-space-size=32768 --trace-warnings")

    def test_no_install_requires_existing_node_modules(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory)

            with (
                mock.patch.object(amplihack_cli, "ensure_checkout", return_value=repo),
                mock.patch.object(amplihack_cli, "ensure_tool"),
                mock.patch.object(amplihack_cli, "run") as run,
            ):
                with self.assertRaisesRegex(SystemExit, "cached node_modules does not exist"):
                    amplihack_cli.main(["a3p-statement-simple", "--no-install"])

        run.assert_not_called()


if __name__ == "__main__":
    unittest.main()
