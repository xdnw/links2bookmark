# Define the path to your package.json file
$packageJsonPath = "h:\Github\links2bookmark\package.json"

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

# Convert the updated object back to JSON. Set a sufficient depth for nested objects.
$updatedJson = $packageJson | ConvertTo-Json -Depth 10

# Write the updated JSON back to package.json.
Set-Content -Path $packageJsonPath -Value $updatedJson

Write-Output "package.json has been updated."