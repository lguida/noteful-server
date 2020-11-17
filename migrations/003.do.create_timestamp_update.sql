CREATE OR REPLACE FUNCTION trigger_setting_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER setting_timestamp
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE PROCEDURE trigger_setting_timestamp();


