import traceback
try:
  import ml_pipeline.main
  print("Loaded successfully")
except:
  traceback.print_exc()
