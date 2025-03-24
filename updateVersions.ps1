# Define the path to your package.json file
$packageJsonPath = "package.json"

# List of packages to update
$packages = @("vite", "typescript", "@swc/core", "@swc/cli")

# Read and convert package.json to a PowerShell object
$jsonContent = Get-Content $packageJsonPath -Raw
$packageJson = $jsonContent | ConvertFrom-Json

foreach ($pkg in $packages) {
    # Get the latest version from npm
    $latestVersion = npm view $pkg version

    if (-not [string]::IsNullOrEmpty($latestVersion)) {
        $newVersion = "^" + $latestVersion
        Write-Output "Updating $pkg to $newVersion"
        $packageJson.devDependencies.$pkg = $newVersion
    }
    else {
        Write-Output "Could not retrieve version for $pkg"
    }
}

# Create a temporary file
$tempFile = [System.IO.Path]::GetTempFileName()

# Save the modified JSON to the temporary file
$packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path $tempFile

# Use jq to format with 2-space indentation and write back to package.json
jq --indent 2 . $tempFile | Set-Content -Path $packageJsonPath

# Clean up the temporary file
Remove-Item $tempFile

Write-Output "package.json has been updated."