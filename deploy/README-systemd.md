# Systemd Timer Kurulumu (Self-hosted / Bazzite)

## Hava Durumu Cron (günde 5 kez)

```bash
# 1. Dosyaları kopyala
sudo cp tarimcrm-hava.service /etc/systemd/system/
sudo cp tarimcrm-hava.timer   /etc/systemd/system/

# 2. CRON_SECRET env değişkenini .env dosyasına ekle
echo "CRON_SECRET=gizli-bir-token-buraya" >> /opt/tarimcrm/.env

# 3. Timer'ı etkinleştir ve başlat
sudo systemctl daemon-reload
sudo systemctl enable --now tarimcrm-hava.timer

# 4. Durum kontrol
systemctl list-timers tarimcrm-hava.timer
journalctl -u tarimcrm-hava.service --since "1 hour ago"
```

## Manuel Test
```bash
# Timer beklemeden tek seferlik çalıştır
sudo systemctl start tarimcrm-hava.service
journalctl -u tarimcrm-hava.service -n 20
```
