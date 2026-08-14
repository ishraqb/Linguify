import { useState, useEffect } from 'react'
import { Box, Container, Flex, Heading, Text } from '@chakra-ui/react'
import { getPopularSongs } from '../services/api'
import ThemeToggle from '../components/ThemeToggle'

const COVER_COLORS = ['#0d6e67', '#c45c12', '#3d5a80', '#6b4f3a', '#2f6b4f', '#1a1814']

const SHELF_SONGS = [
    { id: 1, title: 'Bailando', artist: 'Enrique Iglesias' },
    { id: 2, title: 'Je Veux', artist: 'Zaz' },
    { id: 3, title: 'Lemon', artist: 'Kenshi Yonezu' },
    { id: 4, title: 'Vivir Mi Vida', artist: 'Marc Anthony' },
    { id: 5, title: 'La Vie en Rose', artist: 'Édith Piaf' },
]

function Button({ primary, children, ...rest }) {
    return (
        <Box
            as="button"
            className={primary ? 'main-button' : 'secondary-button'}
            fontWeight="600"
            px="4"
            py="2"
            cursor="pointer"
            {...rest}
        >
            {children}
        </Box>
    )
}

function LyricPreviewCard() {
    return (
        <Box className="lyric-preview-card" p="5" maxW="340px" w="100%">
            <Flex align="center" justify="space-between" mb="4">
                <Flex align="center" gap="3">
                    <Box boxSize="40px" borderRadius="6px" bg={COVER_COLORS[1]} />
                    <Box>
                        <Text fontWeight="800" color="var(--ink)">Je Veux</Text>
                        <Text fontSize="13px" color="var(--muted)">Zaz · French</Text>
                    </Box>
                </Flex>
                <div className="eq-bars"><span /><span /><span /></div>
            </Flex>

            <Box className="lyric-preview-line">
                <Text fontWeight="700" mb="1" color="var(--ink)">Je ne veux pas travailler</Text>
                <Text fontSize="13px" color="var(--muted)" fontStyle="italic">I don't want to work</Text>
            </Box>

            <Flex align="center" mt="4">
                <Text fontSize="12px" color="var(--muted)" fontWeight="700">3 of 5 lines reviewed</Text>
            </Flex>
        </Box>
    )
}

function CoverTile({ song, index }) {
    return (
        <Box className="cover-tile" flex={{ base: '0 0 110px', md: '0 0 140px' }}>
            <Box position="relative" borderRadius="8px" boxSize={{ base: '110px', md: '140px' }} mb="2" bg={COVER_COLORS[index % COVER_COLORS.length]} bgImage={song.coverUrl ? `url(${song.coverUrl})` : undefined} bgSize="cover" bgPosition="center">
                <Flex className="cover-play-btn" position="absolute" bottom="2" right="2" boxSize="32px" borderRadius="8px" bg="var(--ink)" color="var(--paper)" align="center" justify="center">
                    ▶
                </Flex>
            </Box>
            <Text fontWeight="700" fontSize="14px" color="var(--ink)">{song.title}</Text>
            <Text fontSize="12px" color="var(--muted)">{song.artist}</Text>
        </Box>
    )
}

const AUTH_ERROR_MESSAGES = {
    denied: 'Spotify sign-in was cancelled. Try again to continue.',
    state: 'Your login session expired. Please start the login again.',
    spotify: "We couldn't reach Spotify to sign you in. Please try again.",
    server: 'Something went wrong signing you in. Please try again in a moment.',
}

function Landing() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
    const [popularSongs, setPopularSongs] = useState(SHELF_SONGS)

    const [authError] = useState(() => {
        const reason = new URLSearchParams(window.location.search).get('auth_error')
        return reason ? (AUTH_ERROR_MESSAGES[reason] || AUTH_ERROR_MESSAGES.server) : ''
    })

    useEffect(() => {
        getPopularSongs()
            .then((songs) => {
                if (Array.isArray(songs) && songs.length > 0) {
                    setPopularSongs(songs)
                }
            })
            .catch(() => {})
    }, [])

    return (
        <Box className="landing-root">
            <Box className="landing-header">
                <Flex align="center" gap="10px">
                    <img src="/logo-mark.png" alt="Linguify logo" width="48" height="48" style={{ display: 'block', objectFit: 'contain' }} />
                    <Text fontFamily="Fraunces, Georgia, serif" fontSize={{ base: '22px', md: '26px' }} fontWeight="700" letterSpacing="-0.03em" color="var(--teal)">Linguify</Text>
                </Flex>
                <Box className="landing-header-actions">
                    <Text as="a" href="#how-it-works" fontSize={{ base: '14px', md: '16px' }} fontWeight="600" color="var(--ink)">How it works</Text>
                    <ThemeToggle />
                </Box>
            </Box>

            {authError && (
                <Box className="auth-error" maxW="1100px" mx="auto" mt="3" px="4" py="3">
                    {authError}
                </Box>
            )}

            <Box className="hero-gradient">
                <Container maxW="1100px" px="5" py={{ base: '8', md: '14' }}>
                    <Flex direction={{ base: 'column', md: 'row' }} align="center" gap="8">
                        <Box flex="1">
                            <Text fontSize="12px" letterSpacing="0.14em" textTransform="uppercase" fontWeight="600" color="var(--teal)" mb="4">
                                Learn while you listen
                            </Text>
                            <Heading fontFamily="Fraunces, Georgia, serif" fontWeight="700" fontSize={{ base: '32px', md: '44px' }} lineHeight="1.1" letterSpacing="-0.02em" mb="4" color="var(--ink)">
                                Learn languages through the songs you love
                            </Heading>
                            <Text fontSize="18px" color="var(--muted)" lineHeight="1.6" mb="6" maxW="460px">
                                Pick a song from Spotify, read the lyrics line-by-line with translations,
                                save the words you want to remember, and review them as flashcards.
                            </Text>
                            <Button primary as="a" href={`${API_BASE_URL}/api/login`}>
                                Login with Spotify
                            </Button>
                        </Box>
                        <Flex flex="1" justify="center">
                            <LyricPreviewCard />
                        </Flex>
                    </Flex>
                </Container>
            </Box>

            <Box className="landing-band">
                <Container maxW="1100px" px="5" py="8">
                    <Heading fontFamily="Fraunces, Georgia, serif" fontWeight="700" fontSize={{ base: '20px', md: '24px' }} mb="4" color="var(--ink)">Popular right now</Heading>
                    <div className="shelf-row">
                        {popularSongs.map((song, i) => (
                            <CoverTile key={song.songId || song.id || i} song={song} index={i} />
                        ))}
                    </div>
                </Container>
            </Box>

            <Container maxW="1100px" px="5" py={{ base: '8', md: '12' }} id="how-it-works">
                <Box mb="8">
                    <Heading fontFamily="Fraunces, Georgia, serif" fontWeight="700" fontSize={{ base: '24px', md: '30px' }} color="var(--ink)">How it works</Heading>
                </Box>
                <Flex direction={{ base: 'column', md: 'row' }} gap="5">
                    <Box flex="1" className="landing-card" px="5" py="6">
                        <Text fontSize="12px" letterSpacing="0.12em" color="var(--teal)" fontWeight="600" mb="2">01</Text>
                        <Heading fontFamily="Fraunces, Georgia, serif" fontWeight="700" fontSize="20px" mb="2" color="var(--ink)">Pick a song</Heading>
                        <Text color="var(--muted)" lineHeight="1.5">Search Spotify or use a track you recently played.</Text>
                    </Box>
                    <Box flex="1" className="landing-card" px="5" py="6">
                        <Text fontSize="12px" letterSpacing="0.12em" color="var(--teal)" fontWeight="600" mb="2">02</Text>
                        <Heading fontFamily="Fraunces, Georgia, serif" fontWeight="700" fontSize="20px" mb="2" color="var(--ink)">See translations</Heading>
                        <Text color="var(--muted)" lineHeight="1.5">Lyrics appear line-by-line with the meaning underneath.</Text>
                    </Box>
                    <Box flex="1" className="landing-card" px="5" py="6">
                        <Text fontSize="12px" letterSpacing="0.12em" color="var(--teal)" fontWeight="600" mb="2">03</Text>
                        <Heading fontFamily="Fraunces, Georgia, serif" fontWeight="700" fontSize="20px" mb="2" color="var(--ink)">Save &amp; review</Heading>
                        <Text color="var(--muted)" lineHeight="1.5">Tap any word to save it, then study with flashcards.</Text>
                    </Box>
                </Flex>
            </Container>

            <Box className="landing-band-accent">
                <Container maxW="1100px" px="5" py={{ base: '8', md: '12' }}>
                    <Heading fontFamily="Fraunces, Georgia, serif" fontWeight="700" fontSize={{ base: '22px', md: '26px' }} mb="6" color="var(--ink)">Built to make it stick</Heading>
                    <Flex direction={{ base: 'column', md: 'row' }} gap="6">
                        <Box flex="1" className="landing-card" p="5">
                            <Heading fontFamily="Fraunces, Georgia, serif" fontWeight="700" fontSize="18px" mb="2" color="var(--ink)">Streaks &amp; daily goals</Heading>
                            <Text color="var(--muted)">Keep a listening streak going and earn XP for every lesson you finish.</Text>
                        </Box>
                        <Box flex="1" className="landing-card" p="5">
                            <Heading fontFamily="Fraunces, Georgia, serif" fontWeight="700" fontSize="18px" mb="2" color="var(--ink)">Flashcard review</Heading>
                            <Text color="var(--muted)">Every word you save turns into a flashcard you can drill later.</Text>
                        </Box>
                    </Flex>
                </Container>
            </Box>
        </Box>
    )
}

export default Landing
