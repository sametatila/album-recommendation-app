import json
import time
import requests
from bs4 import BeautifulSoup
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from pymongo import MongoClient
from config import config

# Spotify API credentials
SPOTIPY_CLIENT_ID = config['default'].SPOTIPY_CLIENT_ID
SPOTIPY_CLIENT_SECRET = config['default'].SPOTIPY_CLIENT_SECRET

auth_manager = SpotifyClientCredentials(client_id=SPOTIPY_CLIENT_ID, client_secret=SPOTIPY_CLIENT_SECRET)
sp = spotipy.Spotify(auth_manager=auth_manager)

# Function to get genre, album cover URL, and Spotify link
def get_album_info(album, artist):
    try:
        results = sp.search(q=f'album:{album} artist:{artist}', type='album')
        if results['albums']['items']:
            album_info = results['albums']['items'][0]
            artist_id = album_info['artists'][0]['id']
            artist_info = sp.artist(artist_id)
            genres = artist_info.get('genres', ["Unknown"])
            album_cover_url = album_info['images'][0]['url'] if album_info['images'] else "No image available"
            spotify_link = album_info['external_urls']['spotify']
            return genres, album_cover_url, spotify_link
    except Exception as e:
        print(f"Error fetching album info for {album} by {artist}: {e}")
    return ["Unknown"], "No image available", ""

try:
    # Target URL
    url = 'https://www.bmat.com/team'

    # Get the HTML content of the page
    response = requests.get(url)
    response.raise_for_status()
    page_content = response.text

    # Process the HTML content with BeautifulSoup
    soup = BeautifulSoup(page_content, 'html.parser')
    main_container = soup.find('div', class_='grid-x grid-padding-x align-center')

    # List to hold the results
    results = []
    unknown_genre_entries = []

    # Process each relevant sub-element in the main container
    if main_container:
        team_blocks = main_container.find_all('div', class_='small-6 medium-3 large-2 cell margin-vertical-1 text-center')
        print("Number of team members:", len(team_blocks))  # Print the number of team members

        for block in team_blocks:
            data = {}

            # Get the text of h5 and the p tag following the h5
            h5 = block.find('h5')
            p_after_h5 = h5.find_next_sibling('p') if h5 else None
            if h5 and p_after_h5:
                data['name'] = h5.get_text(strip=True)
                data['title'] = p_after_h5.get_text(strip=True)

            # Find the sub-element with the 'loves' class
            loves = block.find('div', class_='loves')
            if loves:
                strong = loves.find('strong')
                p_tags = loves.find_all('p')
                if strong and len(p_tags) > 1:
                    data['album'] = strong.get_text(strip=True)
                    data['artist'] = p_tags[1].get_text(strip=True)
                    
                    # Fetch genre, album cover URL, and Spotify link
                    genres, album_cover_url, spotify_link = get_album_info(data['album'], data['artist'])
                    data['genre'] = genres
                    data['album_cover_url'] = album_cover_url
                    data['spotify_link'] = spotify_link

                    if genres == ["Unknown"] or not spotify_link:
                        unknown_genre_entries.append(data)
                        print("Unknown genre or missing links:", data['album'], "by", data['artist'])
                    else:
                        print("Successfully fetched data for:", data['album'], "by", data['artist'])

            # Add the data to the results list
            results.append(data)
        
        print("Number of entries with 'Unknown' genre or missing links:", len(unknown_genre_entries))

        try:
            # MongoDB Atlas connection string
            client = MongoClient(config['default'].MONGO_URI)
            db = client.musicDB

            # Existing data in the database
            existing_data = list(db.albums.find())

            # Find new, updated, and deleted records
            new_records = []
            updated_records = []
            deleted_records = []

            existing_dict = {record['album']: record for record in existing_data}
            results_dict = {record['album']: record for record in results}

            for album, data in results_dict.items():
                if album not in existing_dict:
                    new_records.append(data)
                elif data != existing_dict[album]:
                    updated_records.append(data)

            for album, data in existing_dict.items():
                if album not in results_dict:
                    deleted_records.append(data)

            # Insert new records
            if new_records:
                db.albums.insert_many(new_records)
                print(f"Inserted {len(new_records)} new records.")

            # Update existing records
            for record in updated_records:
                db.albums.update_one({'album': record['album']}, {'$set': record})
                print(f"Updated record for album: {record['album']}")

            # Delete old records
            for record in deleted_records:
                db.albums.delete_one({'album': record['album']})
                print(f"Deleted record for album: {record['album']}")

        except Exception as e:
            print(f"Error updating MongoDB: {e}")

    else:
        print("Main container not found")
except Exception as e:
    print(f"Error processing HTML content: {e}")
