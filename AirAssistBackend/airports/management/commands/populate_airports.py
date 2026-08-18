from django.core.management.base import BaseCommand
from ...services.airport_sync_service import AirportSyncService

class Command(BaseCommand):
    help = 'Fetch airports from AirportGap and populate the database'

    def handle(self, *args, **kwargs):
        count = AirportSyncService.populate_airports()
        self.stdout.write(self.style.SUCCESS(f'Successfully populated {count} airports into the database.'))