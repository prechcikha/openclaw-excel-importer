<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome - Excel Importer</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .welcome-card {
            max-width: 600px;
            width: 100%;
        }
    </style>
</head>
<body>
    <div class="card welcome-card shadow-lg">
        <div class="card-body text-center p-5">
            <h1 class="mb-4">📊 Excel to MSSQL Importer</h1>
            
            <p class="lead mb-4">
                Upload your Excel files and import data into your remote Microsoft SQL Server with ease.
            </p>

            <div class="row g-3 text-start mb-4">
                <div class="col-md-6">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title text-primary">📤 Easy Upload</h5>
                            <p class="card-text text-muted">Supports .xlsx, .xls, and .csv files up to 5MB.</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title text-success">🔗 Flexible Mapping</h5>
                            <p class="card-text text-muted">Visually map Excel columns to database fields.</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title text-info">💾 Multiple Modes</h5>
                            <p class="card-text text-muted">Insert, update, or upsert data with custom match keys.</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title text-warning">🚀 Batch Processing</h5>
                            <p class="card-text text-muted">Handle 10K-50K+ rows efficiently with progress tracking.</p>
                        </div>
                    </div>
                </div>
            </div>

            <a href="/upload" class="btn btn-primary btn-lg px-5 py-3">
                Get Started →
            </a>

            <p class="mt-4 text-muted small">
                Your data stays secure - only the imported file data goes to your remote MSSQL server.
                No files are permanently stored on this server.
            </p>
        </div>
    </div>
</body>
</html>
